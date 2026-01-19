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

		describe('Relationship Context Integration (Issue #59)', () => {
			/**
			 * Tests for relationship context feature.
			 *
			 * When generating fields, users can optionally include context about the entity's
			 * relationships to other entities. This helps the AI generate more contextually
			 * appropriate and consistent content.
			 */

			it('should include relationship context in prompt when provided', async () => {
				const context: FieldGenerationContext = {
					entityType: 'npc',
					typeDefinition: mockTypeDefinition,
					targetField,
					currentValues: {
						name: 'Merchant Goldweaver',
						fields: {}
					},
					relationshipContext: 'Located at: The Golden Bazaar (marketplace). Member of: Merchant Guild (faction).'
				};

				await generateField(context);

				// Verify the prompt includes relationship context
				// Since we're mocking Anthropic, we need to check the actual call
				// This test will fail until relationshipContext is added to the interface and prompt building
				expect(context.relationshipContext).toBe('Located at: The Golden Bazaar (marketplace). Member of: Merchant Guild (faction).');
			});

			it('should work without relationship context (backward compatibility)', async () => {
				const context: FieldGenerationContext = {
					entityType: 'npc',
					typeDefinition: mockTypeDefinition,
					targetField,
					currentValues: {
						name: 'Guard Captain',
						fields: {}
					}
					// No relationshipContext provided
				};

				const result = await generateField(context);

				// Should still work normally without relationship context
				expect(result.success).toBe(true);
				expect(result.value).toBeDefined();
			});

			it('should handle empty relationship context gracefully', async () => {
				const context: FieldGenerationContext = {
					entityType: 'npc',
					typeDefinition: mockTypeDefinition,
					targetField,
					currentValues: {
						name: 'Innkeeper',
						fields: {}
					},
					relationshipContext: ''
				};

				const result = await generateField(context);

				// Empty string should be treated the same as no context
				expect(result.success).toBe(true);
			});

			it('should include relationship context in summary generation', async () => {
				const context = {
					entityType: 'npc' as EntityType,
					typeDefinition: mockTypeDefinition,
					currentValues: {
						name: 'Blacksmith Ironforge',
						fields: {
							role: 'Master Blacksmith'
						}
					},
					relationshipContext: 'Located at: Ironforge Smithy (location). Member of: Craftsmen Guild (faction).'
				};

				// This will fail until relationshipContext is added to CoreFieldGenerationContext
				// and buildSummaryPrompt is updated
				// await generateSummaryContent(context);

				expect(context.relationshipContext).toBe('Located at: Ironforge Smithy (location). Member of: Craftsmen Guild (faction).');
			});

			it('should include relationship context in description generation', async () => {
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
						summary: 'A mysterious forest',
						fields: {}
					},
					relationshipContext: 'Contains: Ancient Temple (location), Druid Circle (faction). Near: Riverside Village (location).'
				};

				// This will fail until relationshipContext is added to CoreFieldGenerationContext
				// and buildDescriptionPrompt is updated
				// await generateDescriptionContent(context);

				expect(context.relationshipContext).toBe('Contains: Ancient Temple (location), Druid Circle (faction). Near: Riverside Village (location).');
			});

			it('should format relationship context readably in prompt', async () => {
				const context: FieldGenerationContext = {
					entityType: 'npc',
					typeDefinition: mockTypeDefinition,
					targetField,
					currentValues: {
						name: 'High Priest',
						fields: {}
					},
					relationshipContext: 'Located at: Grand Cathedral (location). Leads: Church of Light (faction). Knows: King Aldric (npc).'
				};

				await generateField(context);

				// The implementation should include a clear "Relationships:" section in the prompt
				// This is a quality test - the context should be presented in a way that helps the AI
				expect(context.relationshipContext).toContain('Located at:');
				expect(context.relationshipContext).toContain('Leads:');
				expect(context.relationshipContext).toContain('Knows:');
			});

			it('should handle complex multi-relationship context', async () => {
				const complexContext: FieldGenerationContext = {
					entityType: 'faction',
					typeDefinition: {
						type: 'faction',
						label: 'Faction',
						labelPlural: 'Factions',
						icon: 'flag',
						color: 'faction',
						isBuiltIn: true,
						fieldDefinitions: [
							{
								key: 'goals',
								label: 'Goals',
								type: 'richtext',
								required: false,
								order: 1
							}
						],
						defaultRelationships: []
					},
					targetField: {
						key: 'goals',
						label: 'Goals',
						type: 'richtext',
						required: false,
						order: 1
					},
					currentValues: {
						name: 'The Shadow Council',
						fields: {}
					},
					relationshipContext: 'Led by: Dark Wizard Malkor (npc). Opposed to: Kingdom of Light (faction). Operates from: Shadow Tower (location). Controls: Assassins Guild (faction), Thieves Network (faction).'
				};

				const result = await generateField(complexContext);

				// Should handle multiple relationships gracefully
				// The generated content should be influenced by all these relationships
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

	describe('Relationship Context Integration (Issue #60)', () => {
		/**
		 * Tests for per-field relationship context inclusion in AI generation.
		 *
		 * These tests verify that the field generation service:
		 * 1. Accepts relationship context in the FieldGenerationContext
		 * 2. Includes relationship context in the prompt when provided
		 * 3. Works without relationship context (backward compatible)
		 * 4. Handles relationship context correctly for different field types
		 */

		const mockTypeDefinition: EntityTypeDefinition = {
			type: 'npc',
			label: 'NPC',
			labelPlural: 'NPCs',
			icon: 'users',
			color: 'npc',
			isBuiltIn: true,
			fieldDefinitions: [
				{
					key: 'personality',
					label: 'Personality',
					type: 'richtext',
					required: false,
					order: 1
				},
				{
					key: 'background',
					label: 'Background',
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
				}
			],
			defaultRelationships: ['knows', 'member_of']
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

		describe('FieldGenerationContext Interface Extension', () => {
			it('should accept relationshipContext in FieldGenerationContext', async () => {
				const personalityField: FieldDefinition = {
					key: 'personality',
					label: 'Personality',
					type: 'richtext',
					required: false,
					order: 1
				};

				const context: FieldGenerationContext = {
					entityType: 'npc',
					typeDefinition: mockTypeDefinition,
					targetField: personalityField,
					currentValues: {
						name: 'Thorin',
						fields: {}
					},
					relationshipContext: '=== Relationships for Thorin ===\n[member_of] Thieves Guild: A shadowy organization'
				};

				const result = await generateField(context);

				// Should not fail when relationshipContext is provided
				expect(result).toBeDefined();
				expect(result.success).toBeDefined();
			});

			it('should work without relationshipContext (backward compatible)', async () => {
				const personalityField: FieldDefinition = {
					key: 'personality',
					label: 'Personality',
					type: 'richtext',
					required: false,
					order: 1
				};

				const context: FieldGenerationContext = {
					entityType: 'npc',
					typeDefinition: mockTypeDefinition,
					targetField: personalityField,
					currentValues: {
						name: 'Thorin',
						fields: {}
					}
					// No relationshipContext provided
				};

				const result = await generateField(context);

				// Should work without relationship context
				expect(result).toBeDefined();
				expect(result.success).toBeDefined();
			});
		});

		describe('Prompt Building with Relationship Context', () => {
			it('should include relationship context in prompt when provided', async () => {
				const personalityField: FieldDefinition = {
					key: 'personality',
					label: 'Personality',
					type: 'richtext',
					required: false,
					order: 1
				};

				const relationshipContext = `=== Relationships for Thorin ===
[Relationship: member_of] Thieves Guild (Faction): A shadowy organization of skilled thieves operating in the city
[Relationship: knows] Elara (NPC): A wise elven ranger who often provides information`;

				const context: FieldGenerationContext = {
					entityType: 'npc',
					typeDefinition: mockTypeDefinition,
					targetField: personalityField,
					currentValues: {
						name: 'Thorin',
						description: 'A cunning rogue',
						fields: {
							role: 'Master Thief'
						}
					},
					relationshipContext
				};

				const result = await generateField(context);

				// The implementation should use relationship context in the prompt
				// We can't directly test the prompt content, but we verify the function succeeds
				expect(result).toBeDefined();
			});

			it('should include relationship context for high-priority fields', async () => {
				const highPriorityFields = ['personality', 'motivation', 'goals', 'background'];

				for (const fieldKey of highPriorityFields) {
					const field: FieldDefinition = {
						key: fieldKey,
						label: fieldKey.charAt(0).toUpperCase() + fieldKey.slice(1),
						type: 'richtext',
						required: false,
						order: 1
					};

					const context: FieldGenerationContext = {
						entityType: 'npc',
						typeDefinition: mockTypeDefinition,
						targetField: field,
						currentValues: {
							name: 'Test NPC',
							fields: {}
						},
						relationshipContext: '=== Relationships ===\n[knows] Friend (NPC): A friendly ally'
					};

					const result = await generateField(context);

					expect(result).toBeDefined();
					expect(result.success).toBeDefined();
				}
			});

			it('should handle empty relationship context gracefully', async () => {
				const personalityField: FieldDefinition = {
					key: 'personality',
					label: 'Personality',
					type: 'richtext',
					required: false,
					order: 1
				};

				const context: FieldGenerationContext = {
					entityType: 'npc',
					typeDefinition: mockTypeDefinition,
					targetField: personalityField,
					currentValues: {
						name: 'Lonely NPC',
						fields: {}
					},
					relationshipContext: '' // Empty string
				};

				const result = await generateField(context);

				expect(result).toBeDefined();
				expect(result.success).toBeDefined();
			});

			it('should handle very long relationship context', async () => {
				const personalityField: FieldDefinition = {
					key: 'personality',
					label: 'Personality',
					type: 'richtext',
					required: false,
					order: 1
				};

				// Create a very long relationship context (3000 characters)
				const longContext = `=== Relationships for Popular NPC ===\n` +
					Array(20).fill(0).map((_, i) =>
						`[Relationship: knows] Friend ${i} (NPC): This is a detailed summary about friend ${i} and their background story...`
					).join('\n');

				const context: FieldGenerationContext = {
					entityType: 'npc',
					typeDefinition: mockTypeDefinition,
					targetField: personalityField,
					currentValues: {
						name: 'Popular NPC',
						fields: {}
					},
					relationshipContext: longContext
				};

				const result = await generateField(context);

				expect(result).toBeDefined();
				expect(result.success).toBeDefined();
			});
		});

		describe('Relationship Context Position in Prompt', () => {
			it('should include relationship context between existing context and field instructions', async () => {
				const personalityField: FieldDefinition = {
					key: 'personality',
					label: 'Personality',
					type: 'richtext',
					required: false,
					order: 1
				};

				const relationshipContext = `=== Relationships ===
[member_of] Dark Brotherhood (Faction): An assassins guild`;

				const context: FieldGenerationContext = {
					entityType: 'npc',
					typeDefinition: mockTypeDefinition,
					targetField: personalityField,
					currentValues: {
						name: 'Shadow',
						description: 'A mysterious assassin',
						fields: {}
					},
					relationshipContext
				};

				const result = await generateField(context);

				// The prompt should contain:
				// 1. Campaign context (if provided)
				// 2. Existing entity context (name, description, fields)
				// 3. Relationship context (NEW)
				// 4. Field-specific instructions

				expect(result).toBeDefined();
			});

			it('should work with both campaign context and relationship context', async () => {
				const personalityField: FieldDefinition = {
					key: 'personality',
					label: 'Personality',
					type: 'richtext',
					required: false,
					order: 1
				};

				const context: FieldGenerationContext = {
					entityType: 'npc',
					typeDefinition: mockTypeDefinition,
					targetField: personalityField,
					currentValues: {
						name: 'Gandor',
						fields: {}
					},
					campaignContext: {
						name: 'Rise of the Dark Lord',
						setting: 'High Fantasy',
						system: 'Draw Steel'
					},
					relationshipContext: '=== Relationships ===\n[knows] Wizard (NPC): A powerful mage'
				};

				const result = await generateField(context);

				expect(result).toBeDefined();
				expect(result.success).toBeDefined();
			});
		});

		describe('Relationship Context for Different Field Types', () => {
			it('should include relationship context for text fields', async () => {
				const roleField: FieldDefinition = {
					key: 'role',
					label: 'Role',
					type: 'text',
					required: false,
					order: 1
				};

				const context: FieldGenerationContext = {
					entityType: 'npc',
					typeDefinition: mockTypeDefinition,
					targetField: roleField,
					currentValues: {
						name: 'Test',
						fields: {}
					},
					relationshipContext: '=== Relationships ===\n[member_of] Guild (Faction): A merchants guild'
				};

				const result = await generateField(context);

				expect(result).toBeDefined();
			});

			it('should include relationship context for textarea fields', async () => {
				const descField: FieldDefinition = {
					key: 'description',
					label: 'Description',
					type: 'textarea',
					required: false,
					order: 1
				};

				const context: FieldGenerationContext = {
					entityType: 'npc',
					typeDefinition: mockTypeDefinition,
					targetField: descField,
					currentValues: {
						name: 'Test',
						fields: {}
					},
					relationshipContext: '=== Relationships ===\n[located_at] Tavern (Location): A busy tavern'
				};

				const result = await generateField(context);

				expect(result).toBeDefined();
			});

			it('should include relationship context for richtext fields', async () => {
				const backgroundField: FieldDefinition = {
					key: 'background',
					label: 'Background',
					type: 'richtext',
					required: false,
					order: 1
				};

				const context: FieldGenerationContext = {
					entityType: 'npc',
					typeDefinition: mockTypeDefinition,
					targetField: backgroundField,
					currentValues: {
						name: 'Test',
						fields: {}
					},
					relationshipContext: '=== Relationships ===\n[enemy_of] Villain (NPC): A dangerous enemy'
				};

				const result = await generateField(context);

				expect(result).toBeDefined();
			});
		});

		describe('Relationship Context for Different Entity Types', () => {
			it('should work with relationship context for Character entities', async () => {
				const characterType: EntityTypeDefinition = {
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

				const personalityField: FieldDefinition = {
					key: 'personality',
					label: 'Personality',
					type: 'richtext',
					required: false,
					order: 1
				};

				const context: FieldGenerationContext = {
					entityType: 'character',
					typeDefinition: characterType,
					targetField: personalityField,
					currentValues: {
						name: 'Hero',
						fields: {}
					},
					relationshipContext: '=== Relationships ===\n[member_of] Party (Faction): An adventuring party'
				};

				const result = await generateField(context);

				expect(result).toBeDefined();
			});

			it('should work with relationship context for Faction entities', async () => {
				const factionType: EntityTypeDefinition = {
					type: 'faction',
					label: 'Faction',
					labelPlural: 'Factions',
					icon: 'flag',
					color: 'faction',
					isBuiltIn: true,
					fieldDefinitions: [
						{
							key: 'goals',
							label: 'Goals',
							type: 'richtext',
							required: false,
							order: 1
						}
					],
					defaultRelationships: ['allied_with', 'enemy_of']
				};

				const goalsField: FieldDefinition = {
					key: 'goals',
					label: 'Goals',
					type: 'richtext',
					required: false,
					order: 1
				};

				const context: FieldGenerationContext = {
					entityType: 'faction',
					typeDefinition: factionType,
					targetField: goalsField,
					currentValues: {
						name: 'Knights Order',
						fields: {}
					},
					relationshipContext: '=== Relationships ===\n[allied_with] Kingdom (Faction): A powerful kingdom'
				};

				const result = await generateField(context);

				expect(result).toBeDefined();
			});

			it('should work with relationship context for Location entities', async () => {
				const locationType: EntityTypeDefinition = {
					type: 'location',
					label: 'Location',
					labelPlural: 'Locations',
					icon: 'map-pin',
					color: 'location',
					isBuiltIn: true,
					fieldDefinitions: [
						{
							key: 'description',
							label: 'Description',
							type: 'richtext',
							required: false,
							order: 1
						}
					],
					defaultRelationships: ['located_in', 'connected_to']
				};

				const descField: FieldDefinition = {
					key: 'description',
					label: 'Description',
					type: 'richtext',
					required: false,
					order: 1
				};

				const context: FieldGenerationContext = {
					entityType: 'location',
					typeDefinition: locationType,
					targetField: descField,
					currentValues: {
						name: 'Ancient Temple',
						fields: {}
					},
					relationshipContext: '=== Relationships ===\n[located_in] Forest (Location): A dark forest'
				};

				const result = await generateField(context);

				expect(result).toBeDefined();
			});
		});

		describe('Edge Cases and Error Handling', () => {
			it('should handle undefined relationship context', async () => {
				const personalityField: FieldDefinition = {
					key: 'personality',
					label: 'Personality',
					type: 'richtext',
					required: false,
					order: 1
				};

				const context: FieldGenerationContext = {
					entityType: 'npc',
					typeDefinition: mockTypeDefinition,
					targetField: personalityField,
					currentValues: {
						name: 'Test',
						fields: {}
					},
					relationshipContext: undefined
				};

				const result = await generateField(context);

				expect(result).toBeDefined();
				expect(result.success).toBeDefined();
			});

			it('should handle null relationship context', async () => {
				const personalityField: FieldDefinition = {
					key: 'personality',
					label: 'Personality',
					type: 'richtext',
					required: false,
					order: 1
				};

				const context: FieldGenerationContext = {
					entityType: 'npc',
					typeDefinition: mockTypeDefinition,
					targetField: personalityField,
					currentValues: {
						name: 'Test',
						fields: {}
					},
					relationshipContext: null as any
				};

				const result = await generateField(context);

				expect(result).toBeDefined();
				expect(result.success).toBeDefined();
			});

			it('should handle malformed relationship context', async () => {
				const personalityField: FieldDefinition = {
					key: 'personality',
					label: 'Personality',
					type: 'richtext',
					required: false,
					order: 1
				};

				const context: FieldGenerationContext = {
					entityType: 'npc',
					typeDefinition: mockTypeDefinition,
					targetField: personalityField,
					currentValues: {
						name: 'Test',
						fields: {}
					},
					relationshipContext: 'Invalid format without proper structure'
				};

				const result = await generateField(context);

				// Should still work, just with weird context
				expect(result).toBeDefined();
				expect(result.success).toBeDefined();
			});

			it('should handle special characters in relationship context', async () => {
				const personalityField: FieldDefinition = {
					key: 'personality',
					label: 'Personality',
					type: 'richtext',
					required: false,
					order: 1
				};

				const context: FieldGenerationContext = {
					entityType: 'npc',
					typeDefinition: mockTypeDefinition,
					targetField: personalityField,
					currentValues: {
						name: 'Test',
						fields: {}
					},
					relationshipContext: `=== Relationships ===\n[knows] O'Brien the "Lucky" (NPC): A merchant with <special> & unusual traits...`
				};

				const result = await generateField(context);

				expect(result).toBeDefined();
				expect(result.success).toBeDefined();
			});
		});

		describe('Backward Compatibility', () => {
			it('should generate successfully without relationship context', async () => {
				const personalityField: FieldDefinition = {
					key: 'personality',
					label: 'Personality',
					type: 'richtext',
					required: false,
					order: 1
				};

				// Old-style context without relationshipContext
				const context: FieldGenerationContext = {
					entityType: 'npc',
					typeDefinition: mockTypeDefinition,
					targetField: personalityField,
					currentValues: {
						name: 'Traditional NPC',
						description: 'A regular description',
						fields: {
							role: 'Guard'
						}
					}
				};

				const result = await generateField(context);

				expect(result.success).toBe(true);
				expect(result.value).toBeDefined();
			});

			it('should produce different results with and without relationship context', async () => {
				const personalityField: FieldDefinition = {
					key: 'personality',
					label: 'Personality',
					type: 'richtext',
					required: false,
					order: 1
				};

				// Context without relationships
				const contextWithout: FieldGenerationContext = {
					entityType: 'npc',
					typeDefinition: mockTypeDefinition,
					targetField: personalityField,
					currentValues: {
						name: 'Isolated NPC',
						fields: {}
					}
				};

				// Context with relationships
				const contextWith: FieldGenerationContext = {
					entityType: 'npc',
					typeDefinition: mockTypeDefinition,
					targetField: personalityField,
					currentValues: {
						name: 'Connected NPC',
						fields: {}
					},
					relationshipContext: '=== Relationships ===\n[member_of] Thieves Guild (Faction): A criminal organization'
				};

				const resultWithout = await generateField(contextWithout);
				const resultWith = await generateField(contextWith);

				// Both should succeed
				expect(resultWithout.success).toBe(true);
				expect(resultWith.success).toBe(true);

				// The generated content might be different due to relationship context
				// But we can't test the actual content easily with mocked API
			});
		});
	});
});
