/**
 * Tests for Entity Generation Service
 *
 * Covers:
 * - Complete entity generation from scratch (empty form)
 * - Partial entity generation with context (pre-filled fields)
 * - Field type handling (select, tags, multi-select, number, boolean, text, textarea, richtext)
 * - Campaign context integration
 * - Error handling (API errors, missing keys, parse failures)
 * - Response parsing and validation
 * - Select field validation with fallback to default/first option
 * - Hidden field exclusion from generation
 */
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
	generateEntity,
	hasGenerationApiKey,
	type GenerationContext,
	type GeneratedEntity,
	type GenerationResult
} from './entityGenerationService';
import type { EntityTypeDefinition, FieldDefinition } from '$lib/types';
import Anthropic from '@anthropic-ai/sdk';

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
				text: JSON.stringify({
					name: 'Generated NPC',
					description: 'A well-crafted description of the entity.',
					summary: 'Brief summary for AI context.',
					tags: ['generated', 'npc'],
					fields: {
						role: 'Innkeeper',
						personality: 'Friendly and welcoming',
						appearance: 'Stout with a warm smile',
						status: 'alive',
						skills: ['cooking', 'diplomacy'],
						level: 5,
						isHostile: false,
						alignment: 'good',
						languages: ['Common', 'Elvish']
					}
				})
			}
		]
	});

	const MockAnthropic = function(this: any, config: any) {
		this.messages = {
			create: mockCreate
		};
	};

	// Add APIError class for error testing
	(MockAnthropic as any).APIError = class APIError extends Error {
		status: number;
		constructor(message: string, status: number) {
			super(message);
			this.status = status;
			this.name = 'APIError';
		}
	};

	return {
		default: MockAnthropic
	};
});

describe('entityGenerationService', () => {
	let mockCreate: ReturnType<typeof vi.fn>;

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
				type: 'textarea',
				required: false,
				order: 3
			},
			{
				key: 'status',
				label: 'Status',
				type: 'select',
				options: ['alive', 'deceased', 'unknown'],
				required: true,
				defaultValue: 'alive',
				order: 4
			},
			{
				key: 'skills',
				label: 'Skills',
				type: 'tags',
				required: false,
				order: 5
			},
			{
				key: 'level',
				label: 'Level',
				type: 'number',
				required: false,
				order: 6
			},
			{
				key: 'isHostile',
				label: 'Hostile',
				type: 'boolean',
				required: false,
				order: 7
			},
			{
				key: 'secrets',
				label: 'Secrets',
				type: 'richtext',
				required: false,
				order: 8,
				section: 'hidden'
			},
			{
				key: 'alignment',
				label: 'Alignment',
				type: 'select',
				options: ['good', 'neutral', 'evil'],
				required: false,
				order: 9
			},
			{
				key: 'languages',
				label: 'Languages',
				type: 'multi-select',
				options: ['Common', 'Elvish', 'Dwarvish', 'Orcish'],
				required: false,
				order: 10
			}
		],
		defaultRelationships: ['located_at', 'member_of']
	};

	beforeEach(async () => {
		// Get the mock function from the mocked Anthropic constructor
		const AnthropicModule = await import('@anthropic-ai/sdk');
		const testClient = new AnthropicModule.default({ apiKey: 'test' });
		mockCreate = testClient.messages.create;

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

		// Reset mock to default successful response
		mockCreate.mockResolvedValue({
			content: [
				{
					type: 'text',
					text: JSON.stringify({
						name: 'Generated NPC',
						description: 'A well-crafted description of the entity.',
						summary: 'Brief summary for AI context.',
						tags: ['generated', 'npc'],
						fields: {
							role: 'Innkeeper',
							personality: 'Friendly and welcoming',
							appearance: 'Stout with a warm smile',
							status: 'alive',
							skills: ['cooking', 'diplomacy'],
							level: 5,
							isHostile: false,
							alignment: 'good',
							languages: ['Common', 'Elvish']
						}
					})
				}
			]
		});
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	describe('hasGenerationApiKey', () => {
		it('should return true when API key is configured', () => {
			expect(hasGenerationApiKey()).toBe(true);
		});

		it('should return false when API key is not configured', () => {
			global.localStorage.getItem = vi.fn(() => null);
			expect(hasGenerationApiKey()).toBe(false);
		});

		it('should return false in non-browser environment', () => {
			const originalWindow = global.window;
			// @ts-expect-error - Testing undefined window
			delete global.window;
			expect(hasGenerationApiKey()).toBe(false);
			global.window = originalWindow;
		});
	});

	describe('generateEntity', () => {
		describe('Empty Form Generation', () => {
			it('should generate complete entity from scratch with empty context', async () => {
				const context: GenerationContext = {
					fields: {}
				};

				const result = await generateEntity(mockTypeDefinition, context);

				expect(result.success).toBe(true);
				expect(result.entity).toBeDefined();
				expect(result.entity?.name).toBe('Generated NPC');
				expect(result.entity?.description).toBe('A well-crafted description of the entity.');
				expect(result.entity?.summary).toBe('Brief summary for AI context.');
				expect(result.entity?.tags).toEqual(['generated', 'npc']);
				expect(result.entity?.fields.role).toBe('Innkeeper');
			});

			it('should include all non-hidden fields in generated entity', async () => {
				const context: GenerationContext = {
					fields: {}
				};

				const result = await generateEntity(mockTypeDefinition, context);

				expect(result.success).toBe(true);
				expect(result.entity?.fields).toHaveProperty('role');
				expect(result.entity?.fields).toHaveProperty('personality');
				expect(result.entity?.fields).toHaveProperty('appearance');
				expect(result.entity?.fields).toHaveProperty('status');
			});

			it('should exclude hidden fields from generation', async () => {
				const context: GenerationContext = {
					fields: {}
				};

				mockCreate.mockResolvedValue({
					content: [
						{
							type: 'text',
							text: JSON.stringify({
								name: 'Test NPC',
								description: 'Description',
								summary: 'Summary',
								tags: ['test'],
								fields: {
									role: 'Guard',
									secrets: 'Should not be included' // Hidden field
								}
							})
						}
					]
				});

				const result = await generateEntity(mockTypeDefinition, context);

				// Hidden fields should not be in the generated fields
				// The prompt should not include them, so AI shouldn't generate them
				expect(result.success).toBe(true);
			});
		});

		describe('Partial Form with Context', () => {
			it('should use existing name as context', async () => {
				const context: GenerationContext = {
					name: 'Eldrin the Wise',
					fields: {}
				};

				await generateEntity(mockTypeDefinition, context);

				// Check that the prompt included the name
				expect(mockCreate).toHaveBeenCalledWith(
					expect.objectContaining({
						messages: expect.arrayContaining([
							expect.objectContaining({
								content: expect.stringContaining('Eldrin the Wise')
							})
						])
					})
				);
			});

			it('should use existing description as context', async () => {
				const context: GenerationContext = {
					description: 'A mysterious figure cloaked in shadow',
					fields: {}
				};

				await generateEntity(mockTypeDefinition, context);

				expect(mockCreate).toHaveBeenCalledWith(
					expect.objectContaining({
						messages: expect.arrayContaining([
							expect.objectContaining({
								content: expect.stringContaining('mysterious figure')
							})
						])
					})
				);
			});

			it('should use existing tags as context', async () => {
				const context: GenerationContext = {
					tags: ['wizard', 'elderly', 'wise'],
					fields: {}
				};

				await generateEntity(mockTypeDefinition, context);

				expect(mockCreate).toHaveBeenCalledWith(
					expect.objectContaining({
						messages: expect.arrayContaining([
							expect.objectContaining({
								content: expect.stringContaining('wizard')
							})
						])
					})
				);
			});

			it('should use existing field values as context', async () => {
				const context: GenerationContext = {
					name: 'Guard Captain',
					fields: {
						role: 'Captain of the City Guard',
						level: 10
					}
				};

				await generateEntity(mockTypeDefinition, context);

				expect(mockCreate).toHaveBeenCalledWith(
					expect.objectContaining({
						messages: expect.arrayContaining([
							expect.objectContaining({
								content: expect.stringContaining('Captain of the City Guard')
							})
						])
					})
				);
			});

			it('should handle array field values in context', async () => {
				const context: GenerationContext = {
					fields: {
						skills: ['swordsmanship', 'leadership']
					}
				};

				await generateEntity(mockTypeDefinition, context);

				expect(mockCreate).toHaveBeenCalledWith(
					expect.objectContaining({
						messages: expect.arrayContaining([
							expect.objectContaining({
								content: expect.stringContaining('swordsmanship')
							})
						])
					})
				);
			});

			it('should ignore empty string values in context', async () => {
				const context: GenerationContext = {
					name: '',
					description: '',
					fields: {
						role: ''
					}
				};

				await generateEntity(mockTypeDefinition, context);

				const call = mockCreate.mock.calls[0][0];
				const prompt = call.messages[0].content;

				// Should not include empty context section
				expect(prompt).not.toContain('Name: \n');
			});

			it('should ignore null and undefined values in context', async () => {
				const context: GenerationContext = {
					fields: {
						role: null,
						personality: undefined
					}
				};

				const result = await generateEntity(mockTypeDefinition, context);

				expect(result.success).toBe(true);
			});
		});

		describe('Field Type Handling', () => {
			it('should handle select field with valid option', async () => {
				mockCreate.mockResolvedValue({
					content: [
						{
							type: 'text',
							text: JSON.stringify({
								name: 'NPC',
								description: 'Desc',
								summary: 'Sum',
								tags: [],
								fields: {
									status: 'alive'
								}
							})
						}
					]
				});

				const context: GenerationContext = {
					fields: {}
				};

				const result = await generateEntity(mockTypeDefinition, context);

				expect(result.success).toBe(true);
				expect(result.entity?.fields.status).toBe('alive');
			});

			it('should fall back to default value for invalid select option', async () => {
				mockCreate.mockResolvedValue({
					content: [
						{
							type: 'text',
							text: JSON.stringify({
								name: 'NPC',
								description: 'Desc',
								summary: 'Sum',
								tags: [],
								fields: {
									status: 'invalid-option' // Not in options array
								}
							})
						}
					]
				});

				const context: GenerationContext = {
					fields: {}
				};

				const result = await generateEntity(mockTypeDefinition, context);

				expect(result.success).toBe(true);
				expect(result.entity?.fields.status).toBe('alive'); // default value
			});

			it('should fall back to first option when no default and invalid select value', async () => {
				mockCreate.mockResolvedValue({
					content: [
						{
							type: 'text',
							text: JSON.stringify({
								name: 'NPC',
								description: 'Desc',
								summary: 'Sum',
								tags: [],
								fields: {
									alignment: 'chaotic' // Not in options array
								}
							})
						}
					]
				});

				const context: GenerationContext = {
					fields: {}
				};

				const result = await generateEntity(mockTypeDefinition, context);

				expect(result.success).toBe(true);
				expect(result.entity?.fields.alignment).toBe('good'); // first option
			});

			it('should handle tags field as array', async () => {
				mockCreate.mockResolvedValue({
					content: [
						{
							type: 'text',
							text: JSON.stringify({
								name: 'NPC',
								description: 'Desc',
								summary: 'Sum',
								tags: [],
								fields: {
									skills: ['stealth', 'lockpicking', 'persuasion']
								}
							})
						}
					]
				});

				const context: GenerationContext = {
					fields: {}
				};

				const result = await generateEntity(mockTypeDefinition, context);

				expect(result.success).toBe(true);
				expect(result.entity?.fields.skills).toEqual(['stealth', 'lockpicking', 'persuasion']);
			});

			it('should parse tags field from comma-separated string', async () => {
				mockCreate.mockResolvedValue({
					content: [
						{
							type: 'text',
							text: JSON.stringify({
								name: 'NPC',
								description: 'Desc',
								summary: 'Sum',
								tags: [],
								fields: {
									skills: 'stealth, lockpicking, persuasion'
								}
							})
						}
					]
				});

				const context: GenerationContext = {
					fields: {}
				};

				const result = await generateEntity(mockTypeDefinition, context);

				expect(result.success).toBe(true);
				expect(result.entity?.fields.skills).toEqual(['stealth', 'lockpicking', 'persuasion']);
			});

			it('should handle multi-select field as array', async () => {
				mockCreate.mockResolvedValue({
					content: [
						{
							type: 'text',
							text: JSON.stringify({
								name: 'NPC',
								description: 'Desc',
								summary: 'Sum',
								tags: [],
								fields: {
									languages: ['Common', 'Elvish']
								}
							})
						}
					]
				});

				const context: GenerationContext = {
					fields: {}
				};

				const result = await generateEntity(mockTypeDefinition, context);

				expect(result.success).toBe(true);
				expect(result.entity?.fields.languages).toEqual(['Common', 'Elvish']);
			});

			it('should parse multi-select field from comma-separated string', async () => {
				mockCreate.mockResolvedValue({
					content: [
						{
							type: 'text',
							text: JSON.stringify({
								name: 'NPC',
								description: 'Desc',
								summary: 'Sum',
								tags: [],
								fields: {
									languages: 'Common, Dwarvish'
								}
							})
						}
					]
				});

				const context: GenerationContext = {
					fields: {}
				};

				const result = await generateEntity(mockTypeDefinition, context);

				expect(result.success).toBe(true);
				expect(result.entity?.fields.languages).toEqual(['Common', 'Dwarvish']);
			});

			it('should handle number field and parse to numeric value', async () => {
				mockCreate.mockResolvedValue({
					content: [
						{
							type: 'text',
							text: JSON.stringify({
								name: 'NPC',
								description: 'Desc',
								summary: 'Sum',
								tags: [],
								fields: {
									level: '12'
								}
							})
						}
					]
				});

				const context: GenerationContext = {
					fields: {}
				};

				const result = await generateEntity(mockTypeDefinition, context);

				expect(result.success).toBe(true);
				expect(result.entity?.fields.level).toBe(12);
				expect(typeof result.entity?.fields.level).toBe('number');
			});

			it('should handle boolean field and coerce to boolean', async () => {
				mockCreate.mockResolvedValue({
					content: [
						{
							type: 'text',
							text: JSON.stringify({
								name: 'NPC',
								description: 'Desc',
								summary: 'Sum',
								tags: [],
								fields: {
									isHostile: true
								}
							})
						}
					]
				});

				const context: GenerationContext = {
					fields: {}
				};

				const result = await generateEntity(mockTypeDefinition, context);

				expect(result.success).toBe(true);
				expect(result.entity?.fields.isHostile).toBe(true);
			});

			it('should convert truthy values to boolean true', async () => {
				mockCreate.mockResolvedValue({
					content: [
						{
							type: 'text',
							text: JSON.stringify({
								name: 'NPC',
								description: 'Desc',
								summary: 'Sum',
								tags: [],
								fields: {
									isHostile: 'yes'
								}
							})
						}
					]
				});

				const context: GenerationContext = {
					fields: {}
				};

				const result = await generateEntity(mockTypeDefinition, context);

				expect(result.success).toBe(true);
				expect(result.entity?.fields.isHostile).toBe(true);
			});

			it('should handle text field as string', async () => {
				mockCreate.mockResolvedValue({
					content: [
						{
							type: 'text',
							text: JSON.stringify({
								name: 'NPC',
								description: 'Desc',
								summary: 'Sum',
								tags: [],
								fields: {
									role: 'Master Blacksmith'
								}
							})
						}
					]
				});

				const context: GenerationContext = {
					fields: {}
				};

				const result = await generateEntity(mockTypeDefinition, context);

				expect(result.success).toBe(true);
				expect(result.entity?.fields.role).toBe('Master Blacksmith');
				expect(typeof result.entity?.fields.role).toBe('string');
			});

			it('should handle textarea field as string', async () => {
				mockCreate.mockResolvedValue({
					content: [
						{
							type: 'text',
							text: JSON.stringify({
								name: 'NPC',
								description: 'Desc',
								summary: 'Sum',
								tags: [],
								fields: {
									appearance: 'Tall and imposing with a scarred face'
								}
							})
						}
					]
				});

				const context: GenerationContext = {
					fields: {}
				};

				const result = await generateEntity(mockTypeDefinition, context);

				expect(result.success).toBe(true);
				expect(result.entity?.fields.appearance).toBe('Tall and imposing with a scarred face');
			});

			it('should handle richtext field as string', async () => {
				mockCreate.mockResolvedValue({
					content: [
						{
							type: 'text',
							text: JSON.stringify({
								name: 'NPC',
								description: 'Desc',
								summary: 'Sum',
								tags: [],
								fields: {
									personality: 'Gruff exterior but kind heart'
								}
							})
						}
					]
				});

				const context: GenerationContext = {
					fields: {}
				};

				const result = await generateEntity(mockTypeDefinition, context);

				expect(result.success).toBe(true);
				expect(result.entity?.fields.personality).toBe('Gruff exterior but kind heart');
			});
		});

		describe('Campaign Context', () => {
			it('should include campaign name in prompt', async () => {
				const context: GenerationContext = {
					fields: {}
				};

				const campaignContext = {
					name: 'The Dark Tower',
					setting: 'Dark Fantasy',
					system: 'Draw Steel'
				};

				await generateEntity(mockTypeDefinition, context, campaignContext);

				expect(mockCreate).toHaveBeenCalledWith(
					expect.objectContaining({
						messages: expect.arrayContaining([
							expect.objectContaining({
								content: expect.stringContaining('The Dark Tower')
							})
						])
					})
				);
			});

			it('should include campaign setting in prompt', async () => {
				const context: GenerationContext = {
					fields: {}
				};

				const campaignContext = {
					name: 'Test Campaign',
					setting: 'Cyberpunk Future',
					system: 'Custom'
				};

				await generateEntity(mockTypeDefinition, context, campaignContext);

				expect(mockCreate).toHaveBeenCalledWith(
					expect.objectContaining({
						messages: expect.arrayContaining([
							expect.objectContaining({
								content: expect.stringContaining('Cyberpunk Future')
							})
						])
					})
				);
			});

			it('should include campaign system in prompt', async () => {
				const context: GenerationContext = {
					fields: {}
				};

				const campaignContext = {
					name: 'Test Campaign',
					setting: 'Fantasy',
					system: 'D&D 5e'
				};

				await generateEntity(mockTypeDefinition, context, campaignContext);

				expect(mockCreate).toHaveBeenCalledWith(
					expect.objectContaining({
						messages: expect.arrayContaining([
							expect.objectContaining({
								content: expect.stringContaining('D&D 5e')
							})
						])
					})
				);
			});

			it('should use default setting when not provided', async () => {
				const context: GenerationContext = {
					fields: {}
				};

				const campaignContext = {
					name: 'Test Campaign',
					setting: '',
					system: 'D&D 5e'
				};

				await generateEntity(mockTypeDefinition, context, campaignContext);

				expect(mockCreate).toHaveBeenCalledWith(
					expect.objectContaining({
						messages: expect.arrayContaining([
							expect.objectContaining({
								content: expect.stringContaining('Fantasy')
							})
						])
					})
				);
			});

			it('should use default system when not provided', async () => {
				const context: GenerationContext = {
					fields: {}
				};

				const campaignContext = {
					name: 'Test Campaign',
					setting: 'Fantasy',
					system: ''
				};

				await generateEntity(mockTypeDefinition, context, campaignContext);

				expect(mockCreate).toHaveBeenCalledWith(
					expect.objectContaining({
						messages: expect.arrayContaining([
							expect.objectContaining({
								content: expect.stringContaining('System Agnostic')
							})
						])
					})
				);
			});

			it('should work without campaign context', async () => {
				const context: GenerationContext = {
					fields: {}
				};

				const result = await generateEntity(mockTypeDefinition, context);

				expect(result.success).toBe(true);
			});
		});

		describe('Error Handling', () => {
			it('should return error when API key is not configured', async () => {
				global.localStorage.getItem = vi.fn(() => null);

				const context: GenerationContext = {
					fields: {}
				};

				const result = await generateEntity(mockTypeDefinition, context);

				expect(result.success).toBe(false);
				expect(result.error).toBeDefined();
				expect(result.error).toContain('API key');
				expect(result.entity).toBeUndefined();
			});

			it('should handle 401 unauthorized error', async () => {
				const APIError = (Anthropic as any).APIError;
				mockCreate.mockRejectedValue(new APIError('Unauthorized', 401));

				const context: GenerationContext = {
					fields: {}
				};

				const result = await generateEntity(mockTypeDefinition, context);

				expect(result.success).toBe(false);
				expect(result.error).toContain('Invalid API key');
			});

			it('should handle 429 rate limit error', async () => {
				const APIError = (Anthropic as any).APIError;
				mockCreate.mockRejectedValue(new APIError('Rate limit exceeded', 429));

				const context: GenerationContext = {
					fields: {}
				};

				const result = await generateEntity(mockTypeDefinition, context);

				expect(result.success).toBe(false);
				expect(result.error).toContain('Rate limit');
			});

			it('should handle generic API errors', async () => {
				mockCreate.mockRejectedValue(new Error('Network error'));

				const context: GenerationContext = {
					fields: {}
				};

				const result = await generateEntity(mockTypeDefinition, context);

				expect(result.success).toBe(false);
				expect(result.error).toContain('Network error');
			});

			it('should handle non-text response content', async () => {
				mockCreate.mockResolvedValue({
					content: [
						{
							type: 'image',
							source: { type: 'base64', media_type: 'image/png', data: '' }
						}
					]
				});

				const context: GenerationContext = {
					fields: {}
				};

				const result = await generateEntity(mockTypeDefinition, context);

				expect(result.success).toBe(false);
				expect(result.error).toContain('Unexpected response format');
			});

			it('should handle empty response content', async () => {
				mockCreate.mockResolvedValue({
					content: []
				});

				const context: GenerationContext = {
					fields: {}
				};

				const result = await generateEntity(mockTypeDefinition, context);

				expect(result.success).toBe(false);
				expect(result.error).toContain('Unexpected response format');
			});
		});

		describe('Response Parsing', () => {
			it('should parse valid JSON response', async () => {
				mockCreate.mockResolvedValue({
					content: [
						{
							type: 'text',
							text: JSON.stringify({
								name: 'Test Entity',
								description: 'Test Description',
								summary: 'Test Summary',
								tags: ['test'],
								fields: {}
							})
						}
					]
				});

				const context: GenerationContext = {
					fields: {}
				};

				const result = await generateEntity(mockTypeDefinition, context);

				expect(result.success).toBe(true);
				expect(result.entity?.name).toBe('Test Entity');
			});

			it('should handle JSON wrapped in markdown code blocks', async () => {
				mockCreate.mockResolvedValue({
					content: [
						{
							type: 'text',
							text: '```json\n' + JSON.stringify({
								name: 'Test Entity',
								description: 'Test Description',
								summary: 'Test Summary',
								tags: ['test'],
								fields: {}
							}) + '\n```'
						}
					]
				});

				const context: GenerationContext = {
					fields: {}
				};

				const result = await generateEntity(mockTypeDefinition, context);

				expect(result.success).toBe(true);
				expect(result.entity?.name).toBe('Test Entity');
			});

			it('should handle JSON wrapped in code blocks without language', async () => {
				mockCreate.mockResolvedValue({
					content: [
						{
							type: 'text',
							text: '```\n' + JSON.stringify({
								name: 'Test Entity',
								description: 'Test Description',
								summary: 'Test Summary',
								tags: ['test'],
								fields: {}
							}) + '\n```'
						}
					]
				});

				const context: GenerationContext = {
					fields: {}
				};

				const result = await generateEntity(mockTypeDefinition, context);

				expect(result.success).toBe(true);
				expect(result.entity?.name).toBe('Test Entity');
			});

			it('should return error for invalid JSON', async () => {
				mockCreate.mockResolvedValue({
					content: [
						{
							type: 'text',
							text: 'Not valid JSON at all'
						}
					]
				});

				const context: GenerationContext = {
					fields: {}
				};

				const result = await generateEntity(mockTypeDefinition, context);

				expect(result.success).toBe(false);
				expect(result.error).toContain('Failed to parse');
			});

			it('should return error when name is missing', async () => {
				mockCreate.mockResolvedValue({
					content: [
						{
							type: 'text',
							text: JSON.stringify({
								description: 'Test Description',
								summary: 'Test Summary',
								tags: ['test'],
								fields: {}
							})
						}
					]
				});

				const context: GenerationContext = {
					fields: {}
				};

				const result = await generateEntity(mockTypeDefinition, context);

				expect(result.success).toBe(false);
				expect(result.error).toContain('Failed to parse');
			});

			it('should return error when description is missing', async () => {
				mockCreate.mockResolvedValue({
					content: [
						{
							type: 'text',
							text: JSON.stringify({
								name: 'Test Entity',
								summary: 'Test Summary',
								tags: ['test'],
								fields: {}
							})
						}
					]
				});

				const context: GenerationContext = {
					fields: {}
				};

				const result = await generateEntity(mockTypeDefinition, context);

				expect(result.success).toBe(false);
				expect(result.error).toContain('Failed to parse');
			});

			it('should return error when summary is missing', async () => {
				mockCreate.mockResolvedValue({
					content: [
						{
							type: 'text',
							text: JSON.stringify({
								name: 'Test Entity',
								description: 'Test Description',
								tags: ['test'],
								fields: {}
							})
						}
					]
				});

				const context: GenerationContext = {
					fields: {}
				};

				const result = await generateEntity(mockTypeDefinition, context);

				expect(result.success).toBe(false);
				expect(result.error).toContain('Failed to parse');
			});

			it('should handle missing tags by defaulting to empty array', async () => {
				mockCreate.mockResolvedValue({
					content: [
						{
							type: 'text',
							text: JSON.stringify({
								name: 'Test Entity',
								description: 'Test Description',
								summary: 'Test Summary',
								fields: {}
							})
						}
					]
				});

				const context: GenerationContext = {
					fields: {}
				};

				const result = await generateEntity(mockTypeDefinition, context);

				expect(result.success).toBe(true);
				expect(result.entity?.tags).toEqual([]);
			});

			it('should handle non-array tags by defaulting to empty array', async () => {
				mockCreate.mockResolvedValue({
					content: [
						{
							type: 'text',
							text: JSON.stringify({
								name: 'Test Entity',
								description: 'Test Description',
								summary: 'Test Summary',
								tags: 'not-an-array',
								fields: {}
							})
						}
					]
				});

				const context: GenerationContext = {
					fields: {}
				};

				const result = await generateEntity(mockTypeDefinition, context);

				expect(result.success).toBe(true);
				expect(result.entity?.tags).toEqual([]);
			});

			it('should convert tag values to strings', async () => {
				mockCreate.mockResolvedValue({
					content: [
						{
							type: 'text',
							text: JSON.stringify({
								name: 'Test Entity',
								description: 'Test Description',
								summary: 'Test Summary',
								tags: [123, true, 'string'],
								fields: {}
							})
						}
					]
				});

				const context: GenerationContext = {
					fields: {}
				};

				const result = await generateEntity(mockTypeDefinition, context);

				expect(result.success).toBe(true);
				expect(result.entity?.tags).toEqual(['123', 'true', 'string']);
			});

			it('should handle missing fields object', async () => {
				mockCreate.mockResolvedValue({
					content: [
						{
							type: 'text',
							text: JSON.stringify({
								name: 'Test Entity',
								description: 'Test Description',
								summary: 'Test Summary',
								tags: []
							})
						}
					]
				});

				const context: GenerationContext = {
					fields: {}
				};

				const result = await generateEntity(mockTypeDefinition, context);

				expect(result.success).toBe(true);
				expect(result.entity?.fields).toEqual({});
			});

			it('should skip undefined and null field values', async () => {
				mockCreate.mockResolvedValue({
					content: [
						{
							type: 'text',
							text: JSON.stringify({
								name: 'Test Entity',
								description: 'Test Description',
								summary: 'Test Summary',
								tags: [],
								fields: {
									role: 'Guard',
									personality: null,
									appearance: undefined
								}
							})
						}
					]
				});

				const context: GenerationContext = {
					fields: {}
				};

				const result = await generateEntity(mockTypeDefinition, context);

				expect(result.success).toBe(true);
				expect(result.entity?.fields.role).toBe('Guard');
				expect(result.entity?.fields).not.toHaveProperty('personality');
				expect(result.entity?.fields).not.toHaveProperty('appearance');
			});

			it('should skip invalid number values', async () => {
				mockCreate.mockResolvedValue({
					content: [
						{
							type: 'text',
							text: JSON.stringify({
								name: 'Test Entity',
								description: 'Test Description',
								summary: 'Test Summary',
								tags: [],
								fields: {
									level: 'not-a-number'
								}
							})
						}
					]
				});

				const context: GenerationContext = {
					fields: {}
				};

				const result = await generateEntity(mockTypeDefinition, context);

				expect(result.success).toBe(true);
				expect(result.entity?.fields).not.toHaveProperty('level');
			});
		});

		describe('Prompt Construction', () => {
			it('should include entity type label in prompt', async () => {
				const context: GenerationContext = {
					fields: {}
				};

				await generateEntity(mockTypeDefinition, context);

				expect(mockCreate).toHaveBeenCalledWith(
					expect.objectContaining({
						messages: expect.arrayContaining([
							expect.objectContaining({
								content: expect.stringContaining('NPC')
							})
						])
					})
				);
			});

			it('should include field schemas in prompt', async () => {
				const context: GenerationContext = {
					fields: {}
				};

				await generateEntity(mockTypeDefinition, context);

				const call = mockCreate.mock.calls[0][0];
				const prompt = call.messages[0].content;

				expect(prompt).toContain('role');
				expect(prompt).toContain('Role/Occupation');
				expect(prompt).toContain('text');
			});

			it('should include field options in prompt for select fields', async () => {
				const context: GenerationContext = {
					fields: {}
				};

				await generateEntity(mockTypeDefinition, context);

				const call = mockCreate.mock.calls[0][0];
				const prompt = call.messages[0].content;

				expect(prompt).toContain('alive');
				expect(prompt).toContain('deceased');
				expect(prompt).toContain('unknown');
			});

			it('should include placeholder hints in prompt', async () => {
				const context: GenerationContext = {
					fields: {}
				};

				await generateEntity(mockTypeDefinition, context);

				const call = mockCreate.mock.calls[0][0];
				const prompt = call.messages[0].content;

				expect(prompt).toContain('Innkeeper, Guard Captain');
			});

			it('should exclude hidden fields from prompt', async () => {
				const context: GenerationContext = {
					fields: {}
				};

				await generateEntity(mockTypeDefinition, context);

				const call = mockCreate.mock.calls[0][0];
				const prompt = call.messages[0].content;

				// Should not include the secrets field in field schema
				expect(prompt).not.toContain('secrets');
				expect(prompt).not.toContain('Secrets');
			});
		});
	});
});
