/**
 * Unit Tests for NPC Greetings Field (Issue #45)
 *
 * RED Phase (TDD): These tests define expected behavior before implementation.
 * Tests should FAIL until the greetings field is added to the NPC entity type configuration.
 *
 * Test Strategy:
 * 1. Configuration Tests - Verify greetings field exists with correct properties
 * 2. Field Ordering Tests - Ensure greetings appears between voice and motivation
 * 3. Field Properties Tests - Validate all field definition attributes
 * 4. Type Safety Tests - Confirm field definition follows FieldDefinition interface
 * 5. Integration Tests - Verify field works within NPC entity type context
 *
 * Key Coverage Areas:
 * - Field presence in NPC fieldDefinitions array
 * - Correct field type (textarea)
 * - Appropriate placeholder and help text
 * - Proper ordering between existing fields
 * - Required/optional status
 * - No breaking changes to existing fields
 */
import { describe, it, expect } from 'vitest';
import { BUILT_IN_ENTITY_TYPES, getEntityTypeDefinition } from '$lib/config/entityTypes';
import type { EntityTypeDefinition, FieldDefinition } from '$lib/types/entities';

describe('NPC Entity Type - Greetings Field Configuration', () => {
	let npcType: EntityTypeDefinition | undefined;
	let greetingsField: FieldDefinition | undefined;

	// Helper to get NPC type from built-in types
	const getNpcType = (): EntityTypeDefinition => {
		const npc = BUILT_IN_ENTITY_TYPES.find((t) => t.type === 'npc');
		if (!npc) {
			throw new Error('NPC entity type not found in BUILT_IN_ENTITY_TYPES');
		}
		return npc;
	};

	// Helper to get greetings field from NPC type
	const getGreetingsField = (npc: EntityTypeDefinition): FieldDefinition | undefined => {
		return npc.fieldDefinitions.find((f) => f.key === 'greetings');
	};

	describe('Field Presence', () => {
		it('should include a greetings field in NPC entity type fieldDefinitions', () => {
			npcType = getNpcType();
			greetingsField = getGreetingsField(npcType);

			expect(greetingsField).toBeDefined();
			expect(greetingsField).not.toBeNull();
		});

		it('should include greetings field when fetching NPC type via getEntityTypeDefinition', () => {
			const npc = getEntityTypeDefinition('npc');

			expect(npc).toBeDefined();
			const greetings = npc?.fieldDefinitions.find((f) => f.key === 'greetings');

			expect(greetings).toBeDefined();
		});

		it('should have exactly one greetings field (no duplicates)', () => {
			npcType = getNpcType();
			const greetingsFields = npcType.fieldDefinitions.filter((f) => f.key === 'greetings');

			expect(greetingsFields).toHaveLength(1);
		});
	});

	describe('Field Type and Key', () => {
		it('should have key property set to "greetings"', () => {
			npcType = getNpcType();
			greetingsField = getGreetingsField(npcType);

			expect(greetingsField?.key).toBe('greetings');
		});

		it('should have type property set to "textarea"', () => {
			npcType = getNpcType();
			greetingsField = getGreetingsField(npcType);

			expect(greetingsField?.type).toBe('textarea');
		});

		it('should not be of type richtext', () => {
			npcType = getNpcType();
			greetingsField = getGreetingsField(npcType);

			// Greetings should be simple textarea, not full richtext editor
			expect(greetingsField?.type).not.toBe('richtext');
		});

		it('should not be of type text', () => {
			npcType = getNpcType();
			greetingsField = getGreetingsField(npcType);

			// Greetings needs multiline support, so should be textarea not text
			expect(greetingsField?.type).not.toBe('text');
		});
	});

	describe('Field Label and Display', () => {
		it('should have label property set to "Greetings"', () => {
			npcType = getNpcType();
			greetingsField = getGreetingsField(npcType);

			expect(greetingsField?.label).toBe('Greetings');
		});

		it('should have proper capitalization in label', () => {
			npcType = getNpcType();
			greetingsField = getGreetingsField(npcType);

			// Label should start with capital letter
			expect(greetingsField?.label).toMatch(/^[A-Z]/);
			// Should not be all caps
			expect(greetingsField?.label).not.toBe('GREETINGS');
		});

		it('should have placeholder text', () => {
			npcType = getNpcType();
			greetingsField = getGreetingsField(npcType);

			expect(greetingsField?.placeholder).toBeDefined();
			expect(greetingsField?.placeholder).not.toBe('');
		});

		it('should have meaningful placeholder text', () => {
			npcType = getNpcType();
			greetingsField = getGreetingsField(npcType);

			// Placeholder should provide example or guidance
			expect(greetingsField?.placeholder).toBeTruthy();
			if (greetingsField?.placeholder) {
				expect(greetingsField.placeholder.length).toBeGreaterThan(10);
			}
		});

		it('should have help text to explain the field purpose', () => {
			npcType = getNpcType();
			greetingsField = getGreetingsField(npcType);

			expect(greetingsField?.helpText).toBeDefined();
			expect(greetingsField?.helpText).not.toBe('');
		});

		it('should have descriptive help text', () => {
			npcType = getNpcType();
			greetingsField = getGreetingsField(npcType);

			// Help text should guide user on what to enter
			expect(greetingsField?.helpText).toBeTruthy();
			if (greetingsField?.helpText) {
				expect(greetingsField.helpText.length).toBeGreaterThan(15);
			}
		});
	});

	describe('Field Requirements', () => {
		it('should be optional (required: false)', () => {
			npcType = getNpcType();
			greetingsField = getGreetingsField(npcType);

			expect(greetingsField?.required).toBe(false);
		});

		it('should not have a default value', () => {
			npcType = getNpcType();
			greetingsField = getGreetingsField(npcType);

			// Optional text fields typically don't have default values
			expect(greetingsField?.defaultValue).toBeUndefined();
		});

		it('should not be in a special section', () => {
			npcType = getNpcType();
			greetingsField = getGreetingsField(npcType);

			// Should not be hidden or in special section like 'hidden'
			expect(greetingsField?.section).toBeUndefined();
		});
	});

	describe('Field Ordering', () => {
		it('should have order property set to 5', () => {
			npcType = getNpcType();
			greetingsField = getGreetingsField(npcType);

			expect(greetingsField?.order).toBe(5);
		});

		it('should appear after voice field (order 4)', () => {
			npcType = getNpcType();
			const voiceField = npcType.fieldDefinitions.find((f) => f.key === 'voice');
			greetingsField = getGreetingsField(npcType);

			expect(voiceField?.order).toBe(4);
			expect(greetingsField?.order).toBeGreaterThan(voiceField?.order || 0);
		});

		it('should appear before motivation field', () => {
			npcType = getNpcType();
			const motivationField = npcType.fieldDefinitions.find((f) => f.key === 'motivation');
			greetingsField = getGreetingsField(npcType);

			expect(motivationField?.order).toBeGreaterThan(5);
			expect(greetingsField?.order).toBeLessThan(motivationField?.order || 999);
		});

		it('should have motivation field updated to order 6', () => {
			npcType = getNpcType();
			const motivationField = npcType.fieldDefinitions.find((f) => f.key === 'motivation');

			// Motivation was previously order 5, should now be 6 to make room for greetings
			expect(motivationField?.order).toBe(6);
		});

		it('should maintain correct field sequence: voice, greetings, motivation', () => {
			npcType = getNpcType();
			const voiceField = npcType.fieldDefinitions.find((f) => f.key === 'voice');
			greetingsField = getGreetingsField(npcType);
			const motivationField = npcType.fieldDefinitions.find((f) => f.key === 'motivation');

			expect(voiceField?.order).toBe(4);
			expect(greetingsField?.order).toBe(5);
			expect(motivationField?.order).toBe(6);

			// Verify sequence is correct
			expect(voiceField!.order).toBeLessThan(greetingsField!.order);
			expect(greetingsField!.order).toBeLessThan(motivationField!.order);
		});

		it('should not affect fields before voice (orders 1-3)', () => {
			npcType = getNpcType();
			const roleField = npcType.fieldDefinitions.find((f) => f.key === 'role');
			const personalityField = npcType.fieldDefinitions.find((f) => f.key === 'personality');
			const appearanceField = npcType.fieldDefinitions.find((f) => f.key === 'appearance');

			// These fields should retain their original order values
			expect(roleField?.order).toBe(1);
			expect(personalityField?.order).toBe(2);
			expect(appearanceField?.order).toBe(3);
		});

		it('should not affect fields after motivation (orders 7+)', () => {
			npcType = getNpcType();
			const secretsField = npcType.fieldDefinitions.find((f) => f.key === 'secrets');
			const statusField = npcType.fieldDefinitions.find((f) => f.key === 'status');
			const importanceField = npcType.fieldDefinitions.find((f) => f.key === 'importance');

			// These fields should retain their original order values
			expect(secretsField?.order).toBe(7);
			expect(statusField?.order).toBe(8);
			expect(importanceField?.order).toBe(9);
		});
	});

	describe('Field Definition Completeness', () => {
		it('should have all required FieldDefinition properties', () => {
			npcType = getNpcType();
			greetingsField = getGreetingsField(npcType);

			// Required properties according to FieldDefinition interface
			expect(greetingsField).toHaveProperty('key');
			expect(greetingsField).toHaveProperty('label');
			expect(greetingsField).toHaveProperty('type');
			expect(greetingsField).toHaveProperty('required');
			expect(greetingsField).toHaveProperty('order');
		});

		it('should not have options property (not needed for textarea)', () => {
			npcType = getNpcType();
			greetingsField = getGreetingsField(npcType);

			// Options only needed for select/multi-select fields
			expect(greetingsField?.options).toBeUndefined();
		});

		it('should not have entityTypes property (not an entity reference field)', () => {
			npcType = getNpcType();
			greetingsField = getGreetingsField(npcType);

			// entityTypes only needed for entity-ref/entity-refs fields
			expect(greetingsField?.entityTypes).toBeUndefined();
		});

		it('should conform to FieldDefinition TypeScript interface', () => {
			npcType = getNpcType();
			greetingsField = getGreetingsField(npcType);

			// Type assertion to ensure it matches the interface
			const fieldDef: FieldDefinition = greetingsField as FieldDefinition;

			expect(fieldDef.key).toEqual(expect.any(String));
			expect(fieldDef.label).toEqual(expect.any(String));
			expect(fieldDef.type).toEqual(expect.any(String));
			expect(fieldDef.required).toEqual(expect.any(Boolean));
			expect(fieldDef.order).toEqual(expect.any(Number));
		});
	});

	describe('NPC Entity Type Integrity', () => {
		it('should maintain NPC type as built-in', () => {
			npcType = getNpcType();

			expect(npcType.isBuiltIn).toBe(true);
		});

		it('should maintain NPC type basic properties', () => {
			npcType = getNpcType();

			expect(npcType.type).toBe('npc');
			expect(npcType.label).toBe('NPC');
			expect(npcType.labelPlural).toBe('NPCs');
			expect(npcType.icon).toBe('users');
			expect(npcType.color).toBe('npc');
		});

		it('should maintain all existing NPC fields', () => {
			npcType = getNpcType();
			const existingFieldKeys = [
				'role',
				'personality',
				'appearance',
				'voice',
				'motivation',
				'secrets',
				'status',
				'importance'
			];

			existingFieldKeys.forEach((key) => {
				const field = npcType!.fieldDefinitions.find((f) => f.key === key);
				expect(field).toBeDefined();
			});
		});

		it('should have correct total field count (9 fields including greetings)', () => {
			npcType = getNpcType();

			// Original 8 fields + 1 new greetings field = 9 total
			expect(npcType.fieldDefinitions).toHaveLength(9);
		});

		it('should maintain NPC default relationships', () => {
			npcType = getNpcType();

			expect(npcType.defaultRelationships).toEqual([
				'located_at',
				'member_of',
				'serves',
				'worships',
				'knows'
			]);
		});

		it('should maintain all field order values are unique', () => {
			npcType = getNpcType();
			const orderValues = npcType.fieldDefinitions.map((f) => f.order);
			const uniqueOrders = new Set(orderValues);

			expect(uniqueOrders.size).toBe(orderValues.length);
		});

		it('should maintain sequential ordering without gaps', () => {
			npcType = getNpcType();
			const orderValues = npcType.fieldDefinitions.map((f) => f.order).sort((a, b) => a - b);

			// Should be [1, 2, 3, 4, 5, 6, 7, 8, 9]
			for (let i = 0; i < orderValues.length; i++) {
				expect(orderValues[i]).toBe(i + 1);
			}
		});
	});

	describe('Field Semantic Positioning', () => {
		it('should logically appear after voice-related fields', () => {
			npcType = getNpcType();
			greetingsField = getGreetingsField(npcType);
			const voiceField = npcType.fieldDefinitions.find((f) => f.key === 'voice');

			// Greetings relate to how NPC speaks, so should follow voice field
			expect(greetingsField?.order).toBeGreaterThan(voiceField?.order || 0);
		});

		it('should logically appear before motivation fields', () => {
			npcType = getNpcType();
			greetingsField = getGreetingsField(npcType);
			const motivationField = npcType.fieldDefinitions.find((f) => f.key === 'motivation');

			// Greetings are more about presentation, motivation is deeper character aspect
			expect(greetingsField?.order).toBeLessThan(motivationField?.order || 999);
		});

		it('should appear in presentation section (before secrets and status)', () => {
			npcType = getNpcType();
			greetingsField = getGreetingsField(npcType);
			const secretsField = npcType.fieldDefinitions.find((f) => f.key === 'secrets');
			const statusField = npcType.fieldDefinitions.find((f) => f.key === 'status');

			// Greetings are part of NPC presentation, should come before meta fields
			expect(greetingsField?.order).toBeLessThan(secretsField?.order || 999);
			expect(greetingsField?.order).toBeLessThan(statusField?.order || 999);
		});
	});

	describe('Field Content Guidelines', () => {
		it('should have placeholder that suggests greeting examples', () => {
			npcType = getNpcType();
			greetingsField = getGreetingsField(npcType);

			// Placeholder should guide users with examples
			const placeholder = greetingsField?.placeholder?.toLowerCase() || '';
			const hasExampleKeyword =
				placeholder.includes('e.g.') ||
				placeholder.includes('example') ||
				placeholder.includes('hello') ||
				placeholder.includes('greet') ||
				placeholder.includes('welcome');

			expect(hasExampleKeyword).toBe(true);
		});

		it('should have help text that explains greetings purpose', () => {
			npcType = getNpcType();
			greetingsField = getGreetingsField(npcType);

			// Help text should explain what greetings are for
			const helpText = greetingsField?.helpText?.toLowerCase() || '';
			const hasRelevantKeyword =
				helpText.includes('greet') ||
				helpText.includes('meet') ||
				helpText.includes('introduce') ||
				helpText.includes('say') ||
				helpText.includes('encounter') ||
				helpText.includes('first') ||
				helpText.includes('player');

			expect(hasRelevantKeyword).toBe(true);
		});
	});

	describe('Backwards Compatibility', () => {
		it('should not change voice field properties', () => {
			npcType = getNpcType();
			const voiceField = npcType.fieldDefinitions.find((f) => f.key === 'voice');

			expect(voiceField?.key).toBe('voice');
			expect(voiceField?.label).toBe('Voice/Mannerisms');
			expect(voiceField?.type).toBe('text');
			expect(voiceField?.required).toBe(false);
			expect(voiceField?.placeholder).toBe('e.g., Deep gravelly voice, speaks slowly');
		});

		it('should only change motivation field order property', () => {
			npcType = getNpcType();
			const motivationField = npcType.fieldDefinitions.find((f) => f.key === 'motivation');

			// All properties should remain the same except order
			expect(motivationField?.key).toBe('motivation');
			expect(motivationField?.label).toBe('Motivation');
			expect(motivationField?.type).toBe('richtext');
			expect(motivationField?.required).toBe(false);
		});

		it('should not introduce breaking changes to field definitions', () => {
			npcType = getNpcType();

			// Verify no fields have unexpected new properties
			npcType.fieldDefinitions.forEach((field) => {
				// Should only have known FieldDefinition properties
				const allowedKeys = [
					'key',
					'label',
					'type',
					'required',
					'defaultValue',
					'options',
					'entityTypes',
					'placeholder',
					'helpText',
					'section',
					'order'
				];

				const fieldKeys = Object.keys(field);
				fieldKeys.forEach((key) => {
					expect(allowedKeys).toContain(key);
				});
			});
		});
	});

	describe('Sorting and Display Order', () => {
		it('should appear correctly when fields are sorted by order property', () => {
			npcType = getNpcType();
			const sortedFields = [...npcType.fieldDefinitions].sort((a, b) => a.order - b.order);

			const fieldKeys = sortedFields.map((f) => f.key);

			// Verify greetings appears in correct position in sorted array
			const greetingsIndex = fieldKeys.indexOf('greetings');
			const voiceIndex = fieldKeys.indexOf('voice');
			const motivationIndex = fieldKeys.indexOf('motivation');

			expect(greetingsIndex).toBeGreaterThan(voiceIndex);
			expect(greetingsIndex).toBeLessThan(motivationIndex);
		});

		it('should have all fields properly ordered when sorted', () => {
			npcType = getNpcType();
			const sortedFields = [...npcType.fieldDefinitions].sort((a, b) => a.order - b.order);

			const expectedOrder = [
				'role',
				'personality',
				'appearance',
				'voice',
				'greetings',
				'motivation',
				'secrets',
				'status',
				'importance'
			];

			const actualOrder = sortedFields.map((f) => f.key);

			expect(actualOrder).toEqual(expectedOrder);
		});
	});
});
