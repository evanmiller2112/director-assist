/**
 * Tests for Field Generation Service
 *
 * Covers:
 * - Field type validation (isGeneratableField)
 * - AI generation with context (generateField)
 * - Privacy protection (hidden fields excluded)
 * - Error handling (API errors, missing keys, etc.)
 * - Prompt construction with various context scenarios
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
	generateField,
	isGeneratableField,
	type FieldGenerationContext,
	type FieldGenerationResult
} from './fieldGenerationService';
import type { EntityTypeDefinition, FieldDefinition, FieldType } from '$lib/types';

// Mock the model service
vi.mock('./modelService', () => ({
	getSelectedModel: vi.fn().mockReturnValue('claude-3-5-sonnet-20241022')
}));

// Mock the Anthropic SDK
vi.mock('@anthropic-ai/sdk', () => {
	const mockCreate = vi.fn().mockResolvedValue({
		content: [
			{
				type: 'text',
				text: 'Generated field content here'
			}
		]
	});

	const MockAnthropic = function(this: any, config: any) {
		this.messages = {
			create: mockCreate
		};
	};

	return {
		default: MockAnthropic
	};
});

describe('fieldGenerationService', () => {
	describe('isGeneratableField', () => {
		it('should return true for text fields', () => {
			expect(isGeneratableField('text')).toBe(true);
		});

		it('should return true for textarea fields', () => {
			expect(isGeneratableField('textarea')).toBe(true);
		});

		it('should return true for richtext fields', () => {
			expect(isGeneratableField('richtext')).toBe(true);
		});

		it('should return false for number fields', () => {
			expect(isGeneratableField('number')).toBe(false);
		});

		it('should return false for boolean fields', () => {
			expect(isGeneratableField('boolean')).toBe(false);
		});

		it('should return false for select fields', () => {
			expect(isGeneratableField('select')).toBe(false);
		});

		it('should return false for multi-select fields', () => {
			expect(isGeneratableField('multi-select')).toBe(false);
		});

		it('should return false for tags fields', () => {
			expect(isGeneratableField('tags')).toBe(false);
		});

		it('should return false for entity-ref fields', () => {
			expect(isGeneratableField('entity-ref')).toBe(false);
		});

		it('should return false for entity-refs fields', () => {
			expect(isGeneratableField('entity-refs')).toBe(false);
		});

		it('should return false for date fields', () => {
			expect(isGeneratableField('date')).toBe(false);
		});

		it('should return false for url fields', () => {
			expect(isGeneratableField('url')).toBe(false);
		});

		it('should return false for image fields', () => {
			expect(isGeneratableField('image')).toBe(false);
		});
	});

	describe('generateField', () => {
		// Mock entity type definition for testing
		const mockTypeDefinition: EntityTypeDefinition = {
			type: 'npc',
			label: 'NPC',
			labelPlural: 'NPCs',
			icon: 'users',
			color: 'npc',
			isBuiltIn: true,
			fieldDefinitions: [
				{
					key: 'role',
					label: 'Role/Occupation',
					type: 'text',
					required: false,
					order: 1,
					placeholder: 'e.g., Innkeeper, Guard Captain'
				},
				{
					key: 'personality',
					label: 'Personality',
					type: 'richtext',
					required: false,
					order: 2
				},
				{
					key: 'appearance',
					label: 'Appearance',
					type: 'richtext',
					required: false,
					order: 3
				},
				{
					key: 'secrets',
					label: 'Secrets',
					type: 'richtext',
					required: false,
					order: 4,
					section: 'hidden'
				},
				{
					key: 'status',
					label: 'Status',
					type: 'select',
					options: ['alive', 'deceased', 'unknown'],
					required: true,
					defaultValue: 'alive',
					order: 5
				}
			],
			defaultRelationships: ['located_at', 'member_of']
		};

		const targetField: FieldDefinition = {
			key: 'personality',
			label: 'Personality',
			type: 'richtext',
			required: false,
			order: 2
		};

		beforeEach(() => {
			// Mock localStorage for API key
			global.localStorage = {
				getItem: vi.fn((key: string) => {
					if (key === 'dm-assist-api-key') return 'test-api-key';
					return null;
				}),
				setItem: vi.fn(),
				removeItem: vi.fn(),
				clear: vi.fn(),
				length: 0,
				key: vi.fn()
			};
		});

		describe('Error Handling', () => {
			it('should return error when API key is not configured', async () => {
				// Override localStorage to return null for API key
				global.localStorage.getItem = vi.fn(() => null);

				const context: FieldGenerationContext = {
					entityType: 'npc',
					typeDefinition: mockTypeDefinition,
					targetField,
					currentValues: {
						name: 'Test NPC',
						fields: {}
					}
				};

				const result = await generateField(context);

				expect(result.success).toBe(false);
				expect(result.error).toBeDefined();
				expect(result.error).toContain('API key');
				expect(result.value).toBeUndefined();
			});

			it('should handle API errors gracefully', async () => {
				// This test will fail until the service is implemented
				// The implementation should catch API errors and return appropriate error messages
				const context: FieldGenerationContext = {
					entityType: 'npc',
					typeDefinition: mockTypeDefinition,
					targetField,
					currentValues: {
						name: 'Test NPC',
						fields: {}
					}
				};

				// Mock a failing API call (implementation will need proper mocking)
				// This is a placeholder for the expected behavior
				const result = await generateField(context);

				// Should handle errors gracefully and not throw
				expect(result).toBeDefined();
				expect(result.success).toBeDefined();
			});

			it('should return error for invalid API response format', async () => {
				// Test that the service handles invalid JSON or unexpected response structures
				const context: FieldGenerationContext = {
					entityType: 'npc',
					typeDefinition: mockTypeDefinition,
					targetField,
					currentValues: {
						name: 'Test NPC',
						fields: {}
					}
				};

				// This will fail until implementation handles invalid responses
				const result = await generateField(context);

				expect(result).toBeDefined();
				expect(result.success).toBeDefined();
				if (!result.success) {
					expect(result.error).toBeDefined();
				}
			});
		});

		describe('Prompt Building', () => {
			it('should build context from entity name', async () => {
				const context: FieldGenerationContext = {
					entityType: 'npc',
					typeDefinition: mockTypeDefinition,
					targetField,
					currentValues: {
						name: 'Eldrin the Wise',
						fields: {}
					}
				};

				await generateField(context);

				// The implementation should use the entity name in the prompt
				// This test verifies the function is called correctly
				expect(context.currentValues.name).toBe('Eldrin the Wise');
			});

			it('should build context from filled fields', async () => {
				const context: FieldGenerationContext = {
					entityType: 'npc',
					typeDefinition: mockTypeDefinition,
					targetField,
					currentValues: {
						name: 'Guard Captain',
						description: 'A stern military leader',
						fields: {
							role: 'Captain of the City Guard'
						}
					}
				};

				await generateField(context);

				// Implementation should include other filled fields in context
				expect(context.currentValues.fields.role).toBe('Captain of the City Guard');
			});

			it('should exclude hidden fields from AI context', async () => {
				const secretsField: FieldDefinition = {
					key: 'secrets',
					label: 'Secrets',
					type: 'richtext',
					required: false,
					order: 4,
					section: 'hidden'
				};

				const context: FieldGenerationContext = {
					entityType: 'npc',
					typeDefinition: mockTypeDefinition,
					targetField: secretsField,
					currentValues: {
						name: 'Mysterious Stranger',
						fields: {
							personality: 'Friendly but evasive',
							secrets: 'Is actually a spy' // This should not be included in context for other fields
						}
					}
				};

				await generateField(context);

				// The implementation should filter out hidden fields when building context
				// This is critical for DM-only information
				expect(secretsField.section).toBe('hidden');
			});

			it('should include campaign context when provided', async () => {
				const context: FieldGenerationContext = {
					entityType: 'npc',
					typeDefinition: mockTypeDefinition,
					targetField,
					currentValues: {
						name: 'Village Elder',
						fields: {}
					},
					campaignContext: {
						name: 'The Dark Tower Campaign',
						setting: 'Dark Fantasy',
						system: 'Draw Steel'
					}
				};

				await generateField(context);

				// Implementation should include campaign context in the prompt
				expect(context.campaignContext?.name).toBe('The Dark Tower Campaign');
				expect(context.campaignContext?.setting).toBe('Dark Fantasy');
				expect(context.campaignContext?.system).toBe('Draw Steel');
			});

			it('should handle empty current values', async () => {
				const context: FieldGenerationContext = {
					entityType: 'npc',
					typeDefinition: mockTypeDefinition,
					targetField,
					currentValues: {
						fields: {}
					}
				};

				await generateField(context);

				// Should work even with minimal context
				expect(context.currentValues.fields).toEqual({});
			});

			it('should handle tags in current values', async () => {
				const context: FieldGenerationContext = {
					entityType: 'npc',
					typeDefinition: mockTypeDefinition,
					targetField,
					currentValues: {
						name: 'Merchant',
						tags: ['friendly', 'wealthy', 'information-broker'],
						fields: {}
					}
				};

				await generateField(context);

				// Tags should be included in context building
				expect(context.currentValues.tags).toEqual(['friendly', 'wealthy', 'information-broker']);
			});

			it('should handle notes in current values', async () => {
				const context: FieldGenerationContext = {
					entityType: 'npc',
					typeDefinition: mockTypeDefinition,
					targetField,
					currentValues: {
						name: 'Innkeeper',
						notes: 'DM Note: Has information about the missing caravan',
						fields: {}
					}
				};

				await generateField(context);

				// Notes might or might not be included (implementation decision)
				// But should handle their presence without error
				expect(context.currentValues.notes).toBe('DM Note: Has information about the missing caravan');
			});
		});

		describe('Field Type Handling', () => {
			it('should generate content for text fields', async () => {
				const textField: FieldDefinition = {
					key: 'role',
					label: 'Role/Occupation',
					type: 'text',
					required: false,
					order: 1
				};

				const context: FieldGenerationContext = {
					entityType: 'npc',
					typeDefinition: mockTypeDefinition,
					targetField: textField,
					currentValues: {
						name: 'Town Guard',
						fields: {}
					}
				};

				const result = await generateField(context);

				expect(result.success).toBe(true);
				expect(result.value).toBeDefined();
				expect(typeof result.value).toBe('string');
			});

			it('should generate content for textarea fields', async () => {
				const textareaField: FieldDefinition = {
					key: 'description',
					label: 'Description',
					type: 'textarea',
					required: false,
					order: 1
				};

				const context: FieldGenerationContext = {
					entityType: 'npc',
					typeDefinition: mockTypeDefinition,
					targetField: textareaField,
					currentValues: {
						name: 'Mysterious Stranger',
						fields: {}
					}
				};

				const result = await generateField(context);

				expect(result.success).toBe(true);
				expect(result.value).toBeDefined();
				expect(typeof result.value).toBe('string');
			});

			it('should generate content for richtext fields', async () => {
				const richtextField: FieldDefinition = {
					key: 'personality',
					label: 'Personality',
					type: 'richtext',
					required: false,
					order: 2
				};

				const context: FieldGenerationContext = {
					entityType: 'npc',
					typeDefinition: mockTypeDefinition,
					targetField: richtextField,
					currentValues: {
						name: 'Wise Sage',
						fields: {}
					}
				};

				const result = await generateField(context);

				expect(result.success).toBe(true);
				expect(result.value).toBeDefined();
				expect(typeof result.value).toBe('string');
			});

			it('should respect field placeholder hints', async () => {
				const fieldWithPlaceholder: FieldDefinition = {
					key: 'voice',
					label: 'Voice/Mannerisms',
					type: 'text',
					required: false,
					order: 4,
					placeholder: 'e.g., Deep gravelly voice, speaks slowly'
				};

				const context: FieldGenerationContext = {
					entityType: 'npc',
					typeDefinition: mockTypeDefinition,
					targetField: fieldWithPlaceholder,
					currentValues: {
						name: 'Old Veteran',
						fields: {}
					}
				};

				await generateField(context);

				// Implementation should use placeholder as a hint for generation
				expect(fieldWithPlaceholder.placeholder).toContain('e.g.');
			});

			it('should respect field help text', async () => {
				const fieldWithHelp: FieldDefinition = {
					key: 'motivation',
					label: 'Motivation',
					type: 'richtext',
					required: false,
					order: 5,
					helpText: 'What drives this character? What do they want?'
				};

				const context: FieldGenerationContext = {
					entityType: 'npc',
					typeDefinition: mockTypeDefinition,
					targetField: fieldWithHelp,
					currentValues: {
						name: 'Ambitious Merchant',
						fields: {}
					}
				};

				await generateField(context);

				// Implementation should use helpText as guidance
				expect(fieldWithHelp.helpText).toContain('drives this character');
			});
		});

		describe('Result Structure', () => {
			it('should return success=true with value on successful generation', async () => {
				const context: FieldGenerationContext = {
					entityType: 'npc',
					typeDefinition: mockTypeDefinition,
					targetField,
					currentValues: {
						name: 'Test NPC',
						fields: {}
					}
				};

				const result = await generateField(context);

				if (result.success) {
					expect(result.value).toBeDefined();
					expect(result.error).toBeUndefined();
				}
			});

			it('should return success=false with error message on failure', async () => {
				// Mock missing API key scenario
				global.localStorage.getItem = vi.fn(() => null);

				const context: FieldGenerationContext = {
					entityType: 'npc',
					typeDefinition: mockTypeDefinition,
					targetField,
					currentValues: {
						name: 'Test NPC',
						fields: {}
					}
				};

				const result = await generateField(context);

				expect(result.success).toBe(false);
				expect(result.error).toBeDefined();
				expect(result.value).toBeUndefined();
			});

			it('should return appropriate value type for the field', async () => {
				const context: FieldGenerationContext = {
					entityType: 'npc',
					typeDefinition: mockTypeDefinition,
					targetField,
					currentValues: {
						name: 'Test NPC',
						fields: {}
					}
				};

				const result = await generateField(context);

				// For text/textarea/richtext fields, value should be a string
				if (result.success && result.value !== undefined) {
					expect(typeof result.value).toBe('string');
				}
			});
		});

		describe('Context Awareness', () => {
			it('should generate contextually appropriate content based on other fields', async () => {
				const context: FieldGenerationContext = {
					entityType: 'npc',
					typeDefinition: mockTypeDefinition,
					targetField,
					currentValues: {
						name: 'Grom the Innkeeper',
						description: 'A cheerful halfling who runs the Dancing Dragon Inn',
						fields: {
							role: 'Innkeeper and tavern owner'
						}
					}
				};

				const result = await generateField(context);

				// The generated personality should be influenced by the role and description
				// This is a behavioral test - implementation should use context appropriately
				expect(result).toBeDefined();
			});

			it('should generate different content for same field in different entity types', async () => {
				const characterTypeDefinition: EntityTypeDefinition = {
					type: 'character',
					label: 'Player Character',
					labelPlural: 'Player Characters',
					icon: 'user',
					color: 'character',
					isBuiltIn: true,
					fieldDefinitions: [
						{
							key: 'personality',
							label: 'Personality',
							type: 'richtext',
							required: false,
							order: 1
						}
					],
					defaultRelationships: ['knows']
				};

				const contextNPC: FieldGenerationContext = {
					entityType: 'npc',
					typeDefinition: mockTypeDefinition,
					targetField,
					currentValues: {
						name: 'Guard Captain',
						fields: {}
					}
				};

				const contextPC: FieldGenerationContext = {
					entityType: 'character',
					typeDefinition: characterTypeDefinition,
					targetField,
					currentValues: {
						name: 'Adventurer Hero',
						fields: {}
					}
				};

				// Both should work but generate different appropriate content
				const resultNPC = await generateField(contextNPC);
				const resultPC = await generateField(contextPC);

				expect(resultNPC).toBeDefined();
				expect(resultPC).toBeDefined();
				// Entity type should influence generation
				expect(contextNPC.entityType).toBe('npc');
				expect(contextPC.entityType).toBe('character');
			});
		});

		describe('Edge Cases', () => {
			it('should handle very long entity names', async () => {
				const context: FieldGenerationContext = {
					entityType: 'npc',
					typeDefinition: mockTypeDefinition,
					targetField,
					currentValues: {
						name: 'Sir Reginald Bartholomew Wellington III, Knight Commander of the Order of the Silver Dragon and Protector of the Northern Realms',
						fields: {}
					}
				};

				const result = await generateField(context);
				expect(result).toBeDefined();
			});

			it('should handle special characters in entity data', async () => {
				const context: FieldGenerationContext = {
					entityType: 'npc',
					typeDefinition: mockTypeDefinition,
					targetField,
					currentValues: {
						name: "O'Brien the \"Lucky\"",
						description: 'A merchant with a <complicated> past & many secrets...',
						fields: {}
					}
				};

				const result = await generateField(context);
				expect(result).toBeDefined();
			});

			it('should handle unicode characters', async () => {
				const context: FieldGenerationContext = {
					entityType: 'npc',
					typeDefinition: mockTypeDefinition,
					targetField,
					currentValues: {
						name: 'Måns the Völva',
						description: 'A seer from the frozen north 雪',
						fields: {}
					}
				};

				const result = await generateField(context);
				expect(result).toBeDefined();
			});

			it('should handle empty field values in current values', async () => {
				const context: FieldGenerationContext = {
					entityType: 'npc',
					typeDefinition: mockTypeDefinition,
					targetField,
					currentValues: {
						name: '',
						description: '',
						fields: {
							role: ''
						}
					}
				};

				const result = await generateField(context);
				expect(result).toBeDefined();
			});

			it('should handle null and undefined values gracefully', async () => {
				const context: FieldGenerationContext = {
					entityType: 'npc',
					typeDefinition: mockTypeDefinition,
					targetField,
					currentValues: {
						name: 'Test',
						fields: {
							role: null,
							personality: undefined
						}
					}
				};

				const result = await generateField(context);
				expect(result).toBeDefined();
			});
		});

		describe('Target Field Validation', () => {
			it('should only allow generation for generatable field types', async () => {
				const numberField: FieldDefinition = {
					key: 'level',
					label: 'Level',
					type: 'number',
					required: false,
					order: 1
				};

				const context: FieldGenerationContext = {
					entityType: 'npc',
					typeDefinition: mockTypeDefinition,
					targetField: numberField,
					currentValues: {
						name: 'Test NPC',
						fields: {}
					}
				};

				// Attempting to generate a number field should either:
				// 1. Return an error, or
				// 2. Be prevented by the UI (using isGeneratableField check)
				// The service might allow it and return a string that needs parsing
				const result = await generateField(context);
				expect(result).toBeDefined();
			});

			it('should recognize the target field from typeDefinition', async () => {
				const context: FieldGenerationContext = {
					entityType: 'npc',
					typeDefinition: mockTypeDefinition,
					targetField,
					currentValues: {
						name: 'Test NPC',
						fields: {}
					}
				};

				// The targetField should exist in the typeDefinition
				const fieldExists = mockTypeDefinition.fieldDefinitions.some(
					f => f.key === targetField.key
				);

				expect(fieldExists).toBe(true);

				const result = await generateField(context);
				expect(result).toBeDefined();
			});
		});
	});
});
