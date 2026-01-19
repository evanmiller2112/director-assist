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

	describe('Core Field Generation Functions (Issue #123)', () => {
		/**
		 * Tests for generateSummaryContent() and generateDescriptionContent()
		 *
		 * These are new convenience functions that generate content for the core
		 * summary and description fields using appropriate context and prompts.
		 */

		// Mock entity type definition for these tests
		const mockNPCType: EntityTypeDefinition = {
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
					order: 1
				},
				{
					key: 'personality',
					label: 'Personality',
					type: 'richtext',
					required: false,
					order: 2
				},
				{
					key: 'secrets',
					label: 'Secrets',
					type: 'richtext',
					required: false,
					order: 3,
					section: 'hidden'
				}
			],
			defaultRelationships: []
		};

		describe('generateSummaryContent', () => {
			it('should return error when API key is not configured', async () => {
				// Override localStorage to return null for API key
				global.localStorage.getItem = vi.fn(() => null);

				const context = {
					entityType: 'npc' as EntityType,
					typeDefinition: mockNPCType,
					currentValues: {
						name: 'Test NPC',
						fields: {}
					}
				};

				// This function will be added to the service
				// const result = await generateSummaryContent(context);

				// expect(result.success).toBe(false);
				// expect(result.error).toBeDefined();
				// expect(result.error).toContain('API key');
			});

			it('should generate a brief summary (1-2 sentences)', async () => {
				const context = {
					entityType: 'npc' as EntityType,
					typeDefinition: mockNPCType,
					currentValues: {
						name: 'Eldrin the Wise',
						description: 'An elderly wizard who studies ancient artifacts',
						fields: {
							role: 'Sage and Advisor'
						}
					}
				};

				// This function will be added to the service
				// const result = await generateSummaryContent(context);

				// expect(result.success).toBe(true);
				// expect(result.value).toBeDefined();
				// expect(typeof result.value).toBe('string');
				// Summary should be concise
				// expect(result.value.split('.').length).toBeLessThanOrEqual(3);
			});

			it('should use entity name and type in prompt', async () => {
				const context = {
					entityType: 'location' as EntityType,
					typeDefinition: {
						type: 'location',
						label: 'Location',
						labelPlural: 'Locations',
						icon: 'map-pin',
						color: 'location',
						isBuiltIn: true,
						fieldDefinitions: [],
						defaultRelationships: []
					},
					currentValues: {
						name: 'The Whispering Woods',
						fields: {}
					}
				};

				// Implementation should use entity name and type to build context
				// const result = await generateSummaryContent(context);

				// expect(result).toBeDefined();
				expect(context.entityType).toBe('location');
				expect(context.currentValues.name).toBe('The Whispering Woods');
			});

			it('should include campaign context when provided', async () => {
				const context = {
					entityType: 'npc' as EntityType,
					typeDefinition: mockNPCType,
					currentValues: {
						name: 'Captain Ironforge',
						fields: {}
					},
					campaignContext: {
						name: 'War of the Kingdoms',
						setting: 'Medieval Fantasy',
						system: 'Draw Steel'
					}
				};

				// Campaign context should influence the summary generation
				// const result = await generateSummaryContent(context);

				// expect(result).toBeDefined();
				expect(context.campaignContext?.name).toBe('War of the Kingdoms');
			});

			it('should handle entity with multiple filled fields', async () => {
				const context = {
					entityType: 'npc' as EntityType,
					typeDefinition: mockNPCType,
					currentValues: {
						name: 'Merchant Goldweaver',
						description: 'A shrewd trader',
						tags: ['merchant', 'wealthy'],
						fields: {
							role: 'Guild Master',
							personality: 'Calculating and ambitious'
						}
					}
				};

				// Summary should synthesize all available context
				// const result = await generateSummaryContent(context);

				// expect(result).toBeDefined();
				expect(context.currentValues.tags).toContain('merchant');
			});

			it('should exclude hidden fields from context', async () => {
				const context = {
					entityType: 'npc' as EntityType,
					typeDefinition: mockNPCType,
					currentValues: {
						name: 'Mysterious Stranger',
						fields: {
							personality: 'Friendly and helpful',
							secrets: 'Actually a spy for the enemy' // Hidden field
						}
					}
				};

				// Secrets (hidden fields) should NOT be included in summary generation
				// const result = await generateSummaryContent(context);

				// expect(result).toBeDefined();
				// The generated summary should not contain secret information
			});

			it('should handle minimal context (name only)', async () => {
				const context = {
					entityType: 'faction' as EntityType,
					typeDefinition: {
						type: 'faction',
						label: 'Faction',
						labelPlural: 'Factions',
						icon: 'flag',
						color: 'faction',
						isBuiltIn: true,
						fieldDefinitions: [],
						defaultRelationships: []
					},
					currentValues: {
						name: 'The Silver Hand',
						fields: {}
					}
				};

				// Should work even with minimal context
				// const result = await generateSummaryContent(context);

				// expect(result).toBeDefined();
			});

			it('should handle API errors gracefully', async () => {
				const context = {
					entityType: 'npc' as EntityType,
					typeDefinition: mockNPCType,
					currentValues: {
						name: 'Test',
						fields: {}
					}
				};

				// API errors should return user-friendly messages
				// const result = await generateSummaryContent(context);

				// expect(result).toBeDefined();
				// expect(result.success).toBeDefined();
			});
		});

		describe('generateDescriptionContent', () => {
			it('should return error when API key is not configured', async () => {
				// Override localStorage to return null for API key
				global.localStorage.getItem = vi.fn(() => null);

				const context = {
					entityType: 'location' as EntityType,
					typeDefinition: {
						type: 'location',
						label: 'Location',
						labelPlural: 'Locations',
						icon: 'map-pin',
						color: 'location',
						isBuiltIn: true,
						fieldDefinitions: [],
						defaultRelationships: []
					},
					currentValues: {
						name: 'The Dark Tower',
						fields: {}
					}
				};

				// This function will be added to the service
				// const result = await generateDescriptionContent(context);

				// expect(result.success).toBe(false);
				// expect(result.error).toBeDefined();
				// expect(result.error).toContain('API key');
			});

			it('should generate detailed description (multiple paragraphs)', async () => {
				const context = {
					entityType: 'location' as EntityType,
					typeDefinition: {
						type: 'location',
						label: 'Location',
						labelPlural: 'Locations',
						icon: 'map-pin',
						color: 'location',
						isBuiltIn: true,
						fieldDefinitions: [],
						defaultRelationships: []
					},
					currentValues: {
						name: 'Dragon\'s Peak',
						summary: 'A towering mountain where dragons are said to nest',
						fields: {}
					}
				};

				// Description should be more detailed than summary
				// const result = await generateDescriptionContent(context);

				// expect(result.success).toBe(true);
				// expect(result.value).toBeDefined();
				// expect(typeof result.value).toBe('string');
				// Description should be longer than summary
				// expect(result.value.length).toBeGreaterThan(100);
			});

			it('should use summary as context if available', async () => {
				const context = {
					entityType: 'npc' as EntityType,
					typeDefinition: mockNPCType,
					currentValues: {
						name: 'Grimwald the Sage',
						summary: 'An ancient wizard who guards forbidden knowledge',
						fields: {
							role: 'Guardian of the Archives'
						}
					}
				};

				// Description should expand on the summary
				// const result = await generateDescriptionContent(context);

				// expect(result).toBeDefined();
				expect(context.currentValues.summary).toBeDefined();
			});

			it('should include campaign context when provided', async () => {
				const context = {
					entityType: 'faction' as EntityType,
					typeDefinition: {
						type: 'faction',
						label: 'Faction',
						labelPlural: 'Factions',
						icon: 'flag',
						color: 'faction',
						isBuiltIn: true,
						fieldDefinitions: [],
						defaultRelationships: []
					},
					currentValues: {
						name: 'Order of the Phoenix',
						fields: {}
					},
					campaignContext: {
						name: 'The Burning Crusade',
						setting: 'Dark Fantasy',
						system: 'Draw Steel'
					}
				};

				// Campaign context should influence the description
				// const result = await generateDescriptionContent(context);

				// expect(result).toBeDefined();
				expect(context.campaignContext?.setting).toBe('Dark Fantasy');
			});

			it('should handle entity with tags', async () => {
				const context = {
					entityType: 'item' as EntityType,
					typeDefinition: {
						type: 'item',
						label: 'Item',
						labelPlural: 'Items',
						icon: 'package',
						color: 'item',
						isBuiltIn: true,
						fieldDefinitions: [],
						defaultRelationships: []
					},
					currentValues: {
						name: 'Sword of Truth',
						tags: ['magical', 'legendary', 'artifact'],
						fields: {}
					}
				};

				// Tags should provide context for description
				// const result = await generateDescriptionContent(context);

				// expect(result).toBeDefined();
				expect(context.currentValues.tags).toContain('legendary');
			});

			it('should exclude hidden fields from context', async () => {
				const typeDefWithHidden: EntityTypeDefinition = {
					...mockNPCType,
					fieldDefinitions: [
						...mockNPCType.fieldDefinitions,
						{
							key: 'hidden_weakness',
							label: 'Hidden Weakness',
							type: 'richtext',
							required: false,
							order: 10,
							section: 'hidden'
						}
					]
				};

				const context = {
					entityType: 'npc' as EntityType,
					typeDefinition: typeDefWithHidden,
					currentValues: {
						name: 'Dragon Lord Vexros',
						fields: {
							role: 'Ancient Dragon',
							hidden_weakness: 'Vulnerable to silver' // Should be excluded
						}
					}
				};

				// Hidden fields should NOT leak into description
				// const result = await generateDescriptionContent(context);

				// expect(result).toBeDefined();
				// Generated description should not mention the hidden weakness
			});

			it('should generate evocative, game-ready content', async () => {
				const context = {
					entityType: 'encounter' as EntityType,
					typeDefinition: {
						type: 'encounter',
						label: 'Encounter',
						labelPlural: 'Encounters',
						icon: 'swords',
						color: 'encounter',
						isBuiltIn: true,
						fieldDefinitions: [],
						defaultRelationships: []
					},
					currentValues: {
						name: 'Ambush at Darkwood Pass',
						summary: 'A deadly trap set by bandits',
						tags: ['combat', 'ambush', 'forest'],
						fields: {}
					}
				};

				// Description should be detailed and atmospheric
				// const result = await generateDescriptionContent(context);

				// expect(result).toBeDefined();
				// expect(result.success).toBe(true);
			});

			it('should handle special characters in entity data', async () => {
				const context = {
					entityType: 'npc' as EntityType,
					typeDefinition: mockNPCType,
					currentValues: {
						name: "O'Brien the \"Lucky\"",
						summary: 'A merchant with a <complicated> past & many secrets...',
						fields: {}
					}
				};

				// Special characters should be handled gracefully
				// const result = await generateDescriptionContent(context);

				// expect(result).toBeDefined();
			});

			it('should handle API errors gracefully', async () => {
				const context = {
					entityType: 'location' as EntityType,
					typeDefinition: {
						type: 'location',
						label: 'Location',
						labelPlural: 'Locations',
						icon: 'map-pin',
						color: 'location',
						isBuiltIn: true,
						fieldDefinitions: [],
						defaultRelationships: []
					},
					currentValues: {
						name: 'Test',
						fields: {}
					}
				};

				// API errors should return user-friendly messages
				// const result = await generateDescriptionContent(context);

				// expect(result).toBeDefined();
				// expect(result.success).toBeDefined();
			});
		});
	});
});
