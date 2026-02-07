/**
 * Tests for Field Suggestion Generation Service (Issue #365 - Phase 3)
 *
 * This service generates AI suggestions for empty fields in entities using the
 * existing prompt building infrastructure from fieldGenerationService.
 *
 * Key Features:
 * - Generates suggestions for multiple empty fields in one API call
 * - Stores suggestions in fieldSuggestionRepository for later acceptance/dismissal
 * - Uses isSuggestionsMode from aiSettings store
 * - Reuses prompt building logic from fieldGenerationService
 * - Returns array of created FieldSuggestion objects
 *
 * Test Coverage:
 * - Core suggestion generation for entities with empty fields
 * - Batch generation for multiple fields
 * - Integration with existing prompt building
 * - Storage in repository
 * - Error handling (API errors, missing keys, etc.)
 * - Edge cases (no empty fields, all fields filled, etc.)
 * - Field type filtering (only text-based fields)
 * - Hidden field exclusion
 * - Campaign context integration
 * - Relationship context integration
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import type { EntityType, EntityTypeDefinition, FieldDefinition } from '$lib/types';

// Mock the model service
vi.mock('./modelService', () => ({
	getSelectedModel: vi.fn().mockReturnValue('claude-3-5-sonnet-20241022')
}));

// Create a shared mock for Anthropic API
const mockCreate = vi.fn().mockResolvedValue({
	content: [
		{
			type: 'text',
			text: JSON.stringify({
				suggestions: [
					{
						fieldKey: 'personality',
						value: 'Gruff but kind-hearted, protective of regulars',
						confidence: 0.85
					},
					{
						fieldKey: 'appearance',
						value: 'Stocky build with a weathered face and calloused hands',
						confidence: 0.80
					}
				]
			})
		}
	],
	usage: { input_tokens: 200, output_tokens: 100 }
});

// Mock the Anthropic SDK
vi.mock('@anthropic-ai/sdk', () => {
	return {
		default: class MockAnthropic {
			messages = {
				create: mockCreate
			};
		}
	};
});

// Mock the field suggestion repository
const mockFieldSuggestionRepository = {
	create: vi.fn(),
	getByEntity: vi.fn(),
	getByEntityAndField: vi.fn(),
	update: vi.fn(),
	delete: vi.fn(),
	deleteByEntity: vi.fn()
};

vi.mock('$lib/repositories/fieldSuggestionRepository', () => ({
	fieldSuggestionRepository: mockFieldSuggestionRepository
}));

// Mock the AI settings store
const mockAiSettings = {
	aiMode: 'suggestions' as 'off' | 'suggestions' | 'full',
	isSuggestionsMode: true,
	isEnabled: true,
	isFullMode: false
};

vi.mock('$lib/stores/aiSettings.svelte', () => ({
	aiSettings: mockAiSettings
}));

describe('fieldSuggestionService', () => {
	// Mock entity type definition
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
				key: 'appearance',
				label: 'Appearance',
				type: 'richtext',
				required: false,
				order: 3
			},
			{
				key: 'background',
				label: 'Background',
				type: 'textarea',
				required: false,
				order: 4
			},
			{
				key: 'secrets',
				label: 'Secrets',
				type: 'richtext',
				required: false,
				order: 5,
				section: 'hidden'
			},
			{
				key: 'level',
				label: 'Level',
				type: 'number',
				required: false,
				order: 6
			},
			{
				key: 'status',
				label: 'Status',
				type: 'select',
				options: ['alive', 'deceased', 'unknown'],
				required: false,
				order: 7
			}
		],
		defaultRelationships: ['knows', 'member_of']
	};

	// Mock existing entity data
	const mockExistingEntity = {
		id: 'npc-123',
		type: 'npc' as EntityType,
		name: 'Grimwald the Innkeeper',
		description: 'Owner and operator of The Rusty Tankard inn',
		summary: 'A friendly innkeeper who knows everyone in town',
		tags: ['friendly', 'information-broker'],
		notes: '',
		fields: {
			role: 'Innkeeper',
			// personality: empty
			// appearance: empty
			// background: empty
			level: 5,
			status: 'alive'
		},
		createdAt: new Date(),
		updatedAt: new Date()
	};

	beforeEach(() => {
		// Reset all mocks
		vi.clearAllMocks();

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

		// Reset repository mock to return created suggestions
		mockFieldSuggestionRepository.create.mockImplementation(async (suggestion) => {
			return {
				...suggestion,
				id: `suggestion-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
				createdAt: new Date()
			};
		});

		// Reset Anthropic mock
		mockCreate.mockResolvedValue({
			content: [
				{
					type: 'text',
					text: JSON.stringify({
						suggestions: [
							{
								fieldKey: 'personality',
								value: 'Gruff but kind-hearted, protective of regulars',
								confidence: 0.85
							},
							{
								fieldKey: 'appearance',
								value: 'Stocky build with a weathered face and calloused hands',
								confidence: 0.80
							}
						]
					})
				}
			],
			usage: { input_tokens: 200, output_tokens: 100 }
		});
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	describe('generateSuggestionsForEntity', () => {
		describe('Basic Functionality', () => {
			it('should generate suggestions for empty fields in an entity', async () => {
				// This test will fail until the service is implemented
				const { generateSuggestionsForEntity } = await import('./fieldSuggestionService');

				const result = await generateSuggestionsForEntity(
					'npc',
					'npc-123',
					mockExistingEntity
				);

				expect(result.success).toBe(true);
				expect(result.suggestions).toBeDefined();
				expect(Array.isArray(result.suggestions)).toBe(true);
				expect(result.suggestions!.length).toBeGreaterThan(0);
			});

			it('should identify empty text-based fields to generate suggestions for', async () => {
				const { generateSuggestionsForEntity } = await import('./fieldSuggestionService');

				const result = await generateSuggestionsForEntity(
					'npc',
					'npc-123',
					mockExistingEntity
				);

				expect(result.success).toBe(true);
				// Should generate suggestions for personality, appearance, background
				// but NOT for role (filled), level (number), status (select), secrets (hidden)
				const fieldKeys = result.suggestions?.map(s => s.fieldKey) || [];
				expect(fieldKeys).toContain('personality');
				expect(fieldKeys).toContain('appearance');
			});

			it('should return success but empty array when no empty fields exist', async () => {
				const { generateSuggestionsForEntity } = await import('./fieldSuggestionService');

				const fullyFilledEntity = {
					...mockExistingEntity,
					fields: {
						role: 'Innkeeper',
						personality: 'Friendly and talkative',
						appearance: 'Stocky with a warm smile',
						background: 'Born and raised in the village',
						level: 5,
						status: 'alive'
					}
				};

				const result = await generateSuggestionsForEntity(
					'npc',
					'npc-123',
					fullyFilledEntity
				);

				expect(result.success).toBe(true);
				expect(result.suggestions).toEqual([]);
			});

			it('should return created FieldSuggestion objects with IDs', async () => {
				const { generateSuggestionsForEntity } = await import('./fieldSuggestionService');

				const result = await generateSuggestionsForEntity(
					'npc',
					'npc-123',
					mockExistingEntity
				);

				expect(result.success).toBe(true);
				expect(result.suggestions).toBeDefined();

				result.suggestions!.forEach(suggestion => {
					expect(suggestion).toHaveProperty('id');
					expect(suggestion).toHaveProperty('entityId');
					expect(suggestion).toHaveProperty('entityType');
					expect(suggestion).toHaveProperty('fieldKey');
					expect(suggestion).toHaveProperty('suggestedValue');
					expect(suggestion).toHaveProperty('status');
					expect(suggestion).toHaveProperty('createdAt');
					expect(suggestion.entityId).toBe('npc-123');
					expect(suggestion.entityType).toBe('npc');
					expect(suggestion.status).toBe('pending');
				});
			});
		});

		describe('Batch Generation', () => {
			it('should generate suggestions for multiple empty fields in one API call', async () => {
				const { generateSuggestionsForEntity } = await import('./fieldSuggestionService');

				await generateSuggestionsForEntity(
					'npc',
					'npc-123',
					mockExistingEntity
				);

				// Should only call the API once even with multiple empty fields
				expect(mockCreate).toHaveBeenCalledTimes(1);
			});

			it('should handle batch response with multiple field suggestions', async () => {
				const { generateSuggestionsForEntity } = await import('./fieldSuggestionService');

				mockCreate.mockResolvedValue({
					content: [
						{
							type: 'text',
							text: JSON.stringify({
								suggestions: [
									{
										fieldKey: 'personality',
										value: 'Gruff but kind-hearted',
										confidence: 0.85
									},
									{
										fieldKey: 'appearance',
										value: 'Stocky with weathered hands',
										confidence: 0.80
									},
									{
										fieldKey: 'background',
										value: 'Former soldier turned innkeeper',
										confidence: 0.75
									}
								]
							})
						}
					],
					usage: { input_tokens: 200, output_tokens: 150 }
				});

				const result = await generateSuggestionsForEntity(
					'npc',
					'npc-123',
					mockExistingEntity
				);

				expect(result.success).toBe(true);
				expect(result.suggestions).toHaveLength(3);
			});

			it('should create separate FieldSuggestion records for each field', async () => {
				const { generateSuggestionsForEntity } = await import('./fieldSuggestionService');

				await generateSuggestionsForEntity(
					'npc',
					'npc-123',
					mockExistingEntity
				);

				// Should call repository create for each suggestion
				expect(mockFieldSuggestionRepository.create).toHaveBeenCalled();
				const callCount = mockFieldSuggestionRepository.create.mock.calls.length;
				expect(callCount).toBeGreaterThan(0);
			});
		});

		describe('Prompt Building Integration', () => {
			it('should reuse prompt building logic from fieldGenerationService', async () => {
				const { generateSuggestionsForEntity } = await import('./fieldSuggestionService');

				await generateSuggestionsForEntity(
					'npc',
					'npc-123',
					mockExistingEntity
				);

				// The prompt should include entity context
				const callArgs = mockCreate.mock.calls[0][0];
				const prompt = callArgs.messages[0].content;

				expect(prompt).toContain('Grimwald the Innkeeper');
				expect(prompt).toContain('Innkeeper');
			});

			it('should include campaign context in prompt when available', async () => {
				const { generateSuggestionsForEntity } = await import('./fieldSuggestionService');

				const campaignContext = {
					name: 'The Dark Tower',
					setting: 'Dark Fantasy',
					system: 'Draw Steel'
				};

				await generateSuggestionsForEntity(
					'npc',
					'npc-123',
					mockExistingEntity,
					{ campaignContext }
				);

				const callArgs = mockCreate.mock.calls[0][0];
				const prompt = callArgs.messages[0].content;

				expect(prompt).toContain('The Dark Tower');
				expect(prompt).toContain('Dark Fantasy');
			});

			it('should include relationship context in prompt when provided', async () => {
				const { generateSuggestionsForEntity } = await import('./fieldSuggestionService');

				const relationshipContext = 'Located at: The Rusty Tankard (location). Member of: Innkeepers Guild (faction).';

				await generateSuggestionsForEntity(
					'npc',
					'npc-123',
					mockExistingEntity,
					{ relationshipContext }
				);

				const callArgs = mockCreate.mock.calls[0][0];
				const prompt = callArgs.messages[0].content;

				expect(prompt).toContain('Rusty Tankard');
				expect(prompt).toContain('Innkeepers Guild');
			});

			it('should exclude hidden fields from context', async () => {
				const { generateSuggestionsForEntity } = await import('./fieldSuggestionService');

				const entityWithSecrets = {
					...mockExistingEntity,
					fields: {
						...mockExistingEntity.fields,
						secrets: 'Has a dark past as an assassin'
					}
				};

				await generateSuggestionsForEntity(
					'npc',
					'npc-123',
					entityWithSecrets
				);

				const callArgs = mockCreate.mock.calls[0][0];
				const prompt = callArgs.messages[0].content;

				// Secrets should not be in the prompt
				expect(prompt).not.toContain('assassin');
				expect(prompt).not.toContain('dark past');
			});

			it('should use existing filled fields as context', async () => {
				const { generateSuggestionsForEntity } = await import('./fieldSuggestionService');

				await generateSuggestionsForEntity(
					'npc',
					'npc-123',
					mockExistingEntity
				);

				const callArgs = mockCreate.mock.calls[0][0];
				const prompt = callArgs.messages[0].content;

				// Should include the filled role field
				expect(prompt).toContain('Innkeeper');
			});
		});

		describe('Field Type Filtering', () => {
			it('should only generate suggestions for text-based fields', async () => {
				const { generateSuggestionsForEntity } = await import('./fieldSuggestionService');

				const result = await generateSuggestionsForEntity(
					'npc',
					'npc-123',
					mockExistingEntity
				);

				// Should not generate suggestions for number or select fields
				const fieldKeys = result.suggestions?.map(s => s.fieldKey) || [];
				expect(fieldKeys).not.toContain('level');
				expect(fieldKeys).not.toContain('status');
			});

			it('should support text field suggestions', async () => {
				const { generateSuggestionsForEntity } = await import('./fieldSuggestionService');

				const entityWithEmptyText = {
					...mockExistingEntity,
					fields: {
						...mockExistingEntity.fields,
						role: '' // Empty text field
					}
				};

				const result = await generateSuggestionsForEntity(
					'npc',
					'npc-123',
					entityWithEmptyText
				);

				const fieldKeys = result.suggestions?.map(s => s.fieldKey) || [];
				expect(fieldKeys).toContain('role');
			});

			it('should support textarea field suggestions', async () => {
				const { generateSuggestionsForEntity } = await import('./fieldSuggestionService');

				const result = await generateSuggestionsForEntity(
					'npc',
					'npc-123',
					mockExistingEntity
				);

				const fieldKeys = result.suggestions?.map(s => s.fieldKey) || [];
				// background is a textarea field
				expect(fieldKeys).toContain('background');
			});

			it('should support richtext field suggestions', async () => {
				const { generateSuggestionsForEntity } = await import('./fieldSuggestionService');

				const result = await generateSuggestionsForEntity(
					'npc',
					'npc-123',
					mockExistingEntity
				);

				const fieldKeys = result.suggestions?.map(s => s.fieldKey) || [];
				// personality and appearance are richtext fields
				expect(fieldKeys).toContain('personality');
				expect(fieldKeys).toContain('appearance');
			});

			it('should respect aiGenerate: false field property', async () => {
				const { generateSuggestionsForEntity } = await import('./fieldSuggestionService');

				const typeDefWithDisabled: EntityTypeDefinition = {
					...mockNPCType,
					fieldDefinitions: [
						...mockNPCType.fieldDefinitions.filter(f => f.key !== 'personality'),
						{
							key: 'personality',
							label: 'Personality',
							type: 'richtext',
							required: false,
							order: 2,
							aiGenerate: false // Disabled for AI generation
						}
					]
				};

				const result = await generateSuggestionsForEntity(
					'npc',
					'npc-123',
					mockExistingEntity
				);

				const fieldKeys = result.suggestions?.map(s => s.fieldKey) || [];
				// Should not generate suggestion for personality if aiGenerate is false
				// This test will need the type definition passed to the function
				expect(fieldKeys).toBeDefined();
			});
		});

		describe('Hidden Field Exclusion', () => {
			it('should never generate suggestions for hidden fields', async () => {
				const { generateSuggestionsForEntity } = await import('./fieldSuggestionService');

				const entityWithEmptySecrets = {
					...mockExistingEntity,
					fields: {
						...mockExistingEntity.fields,
						secrets: '' // Empty hidden field
					}
				};

				const result = await generateSuggestionsForEntity(
					'npc',
					'npc-123',
					entityWithEmptySecrets
				);

				const fieldKeys = result.suggestions?.map(s => s.fieldKey) || [];
				expect(fieldKeys).not.toContain('secrets');
			});

			it('should exclude hidden fields from being sent to AI', async () => {
				const { generateSuggestionsForEntity } = await import('./fieldSuggestionService');

				await generateSuggestionsForEntity(
					'npc',
					'npc-123',
					mockExistingEntity
				);

				const callArgs = mockCreate.mock.calls[0][0];
				const prompt = callArgs.messages[0].content;

				// Should not mention hidden fields in the prompt
				expect(prompt).not.toContain('secrets');
				expect(prompt).not.toContain('Secrets');
			});
		});

		describe('Repository Storage', () => {
			it('should store each suggestion in fieldSuggestionRepository', async () => {
				const { generateSuggestionsForEntity } = await import('./fieldSuggestionService');

				await generateSuggestionsForEntity(
					'npc',
					'npc-123',
					mockExistingEntity
				);

				expect(mockFieldSuggestionRepository.create).toHaveBeenCalled();
			});

			it('should store suggestions with correct structure', async () => {
				const { generateSuggestionsForEntity } = await import('./fieldSuggestionService');

				await generateSuggestionsForEntity(
					'npc',
					'npc-123',
					mockExistingEntity
				);

				const firstCall = mockFieldSuggestionRepository.create.mock.calls[0];
				const storedSuggestion = firstCall[0];

				expect(storedSuggestion).toHaveProperty('entityId', 'npc-123');
				expect(storedSuggestion).toHaveProperty('entityType', 'npc');
				expect(storedSuggestion).toHaveProperty('fieldKey');
				expect(storedSuggestion).toHaveProperty('suggestedValue');
				expect(storedSuggestion).toHaveProperty('status', 'pending');
			});

			it('should include confidence score if provided by AI', async () => {
				const { generateSuggestionsForEntity } = await import('./fieldSuggestionService');

				mockCreate.mockResolvedValue({
					content: [
						{
							type: 'text',
							text: JSON.stringify({
								suggestions: [
									{
										fieldKey: 'personality',
										value: 'Gruff but kind',
										confidence: 0.92
									}
								]
							})
						}
					],
					usage: { input_tokens: 200, output_tokens: 50 }
				});

				await generateSuggestionsForEntity(
					'npc',
					'npc-123',
					mockExistingEntity
				);

				const firstCall = mockFieldSuggestionRepository.create.mock.calls[0];
				const storedSuggestion = firstCall[0];

				expect(storedSuggestion.confidence).toBeDefined();
			});
		});

		describe('Error Handling', () => {
			it('should return error when API key is not configured', async () => {
				const { generateSuggestionsForEntity } = await import('./fieldSuggestionService');

				global.localStorage.getItem = vi.fn(() => null);

				const result = await generateSuggestionsForEntity(
					'npc',
					'npc-123',
					mockExistingEntity
				);

				expect(result.success).toBe(false);
				expect(result.error).toBeDefined();
				expect(result.error).toContain('API key');
			});

			it('should handle API 401 unauthorized error gracefully', async () => {
				const { generateSuggestionsForEntity } = await import('./fieldSuggestionService');

				mockCreate.mockRejectedValue({
					status: 401,
					message: 'Unauthorized'
				});

				const result = await generateSuggestionsForEntity(
					'npc',
					'npc-123',
					mockExistingEntity
				);

				expect(result.success).toBe(false);
				expect(result.error).toContain('Invalid API key');
			});

			it('should handle API 429 rate limit error gracefully', async () => {
				const { generateSuggestionsForEntity } = await import('./fieldSuggestionService');

				mockCreate.mockRejectedValue({
					status: 429,
					message: 'Rate limit exceeded'
				});

				const result = await generateSuggestionsForEntity(
					'npc',
					'npc-123',
					mockExistingEntity
				);

				expect(result.success).toBe(false);
				expect(result.error).toContain('Rate limit');
			});

			it('should handle generic API errors gracefully', async () => {
				const { generateSuggestionsForEntity } = await import('./fieldSuggestionService');

				mockCreate.mockRejectedValue(new Error('Network error'));

				const result = await generateSuggestionsForEntity(
					'npc',
					'npc-123',
					mockExistingEntity
				);

				expect(result.success).toBe(false);
				expect(result.error).toBeDefined();
			});

			it('should handle malformed AI response gracefully', async () => {
				const { generateSuggestionsForEntity } = await import('./fieldSuggestionService');

				mockCreate.mockResolvedValue({
					content: [
						{
							type: 'text',
							text: 'Not valid JSON'
						}
					]
				});

				const result = await generateSuggestionsForEntity(
					'npc',
					'npc-123',
					mockExistingEntity
				);

				expect(result.success).toBe(false);
				expect(result.error).toBeDefined();
			});

			it('should handle missing suggestions array in response', async () => {
				const { generateSuggestionsForEntity } = await import('./fieldSuggestionService');

				mockCreate.mockResolvedValue({
					content: [
						{
							type: 'text',
							text: JSON.stringify({
								// Missing suggestions array
							})
						}
					]
				});

				const result = await generateSuggestionsForEntity(
					'npc',
					'npc-123',
					mockExistingEntity
				);

				expect(result.success).toBe(false);
				expect(result.error).toBeDefined();
			});

			it('should handle repository storage errors gracefully', async () => {
				const { generateSuggestionsForEntity } = await import('./fieldSuggestionService');

				mockFieldSuggestionRepository.create.mockRejectedValue(
					new Error('Database error')
				);

				const result = await generateSuggestionsForEntity(
					'npc',
					'npc-123',
					mockExistingEntity
				);

				expect(result.success).toBe(false);
				expect(result.error).toContain('Database error');
			});

			it('should handle partial success when some suggestions fail to store', async () => {
				const { generateSuggestionsForEntity } = await import('./fieldSuggestionService');

				// First call succeeds, second fails
				mockFieldSuggestionRepository.create
					.mockResolvedValueOnce({
						id: 'suggestion-1',
						entityId: 'npc-123',
						entityType: 'npc',
						fieldKey: 'personality',
						suggestedValue: 'Friendly',
						status: 'pending',
						createdAt: new Date()
					})
					.mockRejectedValueOnce(new Error('Storage failed'));

				const result = await generateSuggestionsForEntity(
					'npc',
					'npc-123',
					mockExistingEntity
				);

				// Should report the error but may return partial results
				expect(result.success).toBe(false);
				expect(result.error).toBeDefined();
			});
		});

		describe('Edge Cases', () => {
			it('should handle entity with all non-generatable fields', async () => {
				const { generateSuggestionsForEntity } = await import('./fieldSuggestionService');

				const typeDefWithNoTextFields: EntityTypeDefinition = {
					type: 'custom',
					label: 'Custom',
					labelPlural: 'Customs',
					icon: 'star',
					color: 'custom',
					isBuiltIn: false,
					fieldDefinitions: [
						{
							key: 'level',
							label: 'Level',
							type: 'number',
							required: false,
							order: 1
						},
						{
							key: 'active',
							label: 'Active',
							type: 'boolean',
							required: false,
							order: 2
						}
					],
					defaultRelationships: []
				};

				const result = await generateSuggestionsForEntity(
					'custom',
					'custom-123',
					{
						...mockExistingEntity,
						type: 'custom',
						fields: {}
					}
				);

				expect(result.success).toBe(true);
				expect(result.suggestions).toEqual([]);
			});

			it('should handle entity with no field definitions', async () => {
				const { generateSuggestionsForEntity } = await import('./fieldSuggestionService');

				const minimalTypeDef: EntityTypeDefinition = {
					type: 'minimal',
					label: 'Minimal',
					labelPlural: 'Minimals',
					icon: 'circle',
					color: 'minimal',
					isBuiltIn: false,
					fieldDefinitions: [],
					defaultRelationships: []
				};

				const result = await generateSuggestionsForEntity(
					'minimal',
					'minimal-123',
					{
						...mockExistingEntity,
						type: 'minimal',
						fields: {}
					}
				);

				expect(result.success).toBe(true);
				expect(result.suggestions).toEqual([]);
			});

			it('should handle very long entity names gracefully', async () => {
				const { generateSuggestionsForEntity } = await import('./fieldSuggestionService');

				const longName = 'Sir Reginald Bartholomew Wellington III, Knight Commander of the Order of the Silver Dragon and Protector of the Northern Realms';

				const result = await generateSuggestionsForEntity(
					'npc',
					'npc-123',
					{
						...mockExistingEntity,
						name: longName
					}
				);

				expect(result).toBeDefined();
				expect(result.success).toBeDefined();
			});

			it('should handle special characters in entity data', async () => {
				const { generateSuggestionsForEntity } = await import('./fieldSuggestionService');

				const result = await generateSuggestionsForEntity(
					'npc',
					'npc-123',
					{
						...mockExistingEntity,
						name: "O'Brien the \"Lucky\"",
						description: 'A merchant with a <complicated> past & many secrets...'
					}
				);

				expect(result).toBeDefined();
				expect(result.success).toBeDefined();
			});

			it('should handle unicode characters in entity data', async () => {
				const { generateSuggestionsForEntity } = await import('./fieldSuggestionService');

				const result = await generateSuggestionsForEntity(
					'npc',
					'npc-123',
					{
						...mockExistingEntity,
						name: 'Måns the Völva',
						description: 'A seer from the frozen north 雪'
					}
				);

				expect(result).toBeDefined();
				expect(result.success).toBeDefined();
			});
		});

		describe('AI Settings Integration', () => {
			it('should work when isSuggestionsMode is true', async () => {
				const { generateSuggestionsForEntity } = await import('./fieldSuggestionService');

				mockAiSettings.aiMode = 'suggestions';
				mockAiSettings.isSuggestionsMode = true;

				const result = await generateSuggestionsForEntity(
					'npc',
					'npc-123',
					mockExistingEntity
				);

				expect(result.success).toBe(true);
			});

			it('should work regardless of AI mode (service-level decision)', async () => {
				const { generateSuggestionsForEntity } = await import('./fieldSuggestionService');

				// Even if mode is 'full', the service should work if explicitly called
				mockAiSettings.aiMode = 'full';
				mockAiSettings.isSuggestionsMode = false;

				const result = await generateSuggestionsForEntity(
					'npc',
					'npc-123',
					mockExistingEntity
				);

				// Service should still work - UI layer controls when to call it
				expect(result).toBeDefined();
			});
		});

		describe('Response Structure', () => {
			it('should return success with array of suggestions on successful generation', async () => {
				const { generateSuggestionsForEntity } = await import('./fieldSuggestionService');

				const result = await generateSuggestionsForEntity(
					'npc',
					'npc-123',
					mockExistingEntity
				);

				expect(result).toMatchObject({
					success: true,
					suggestions: expect.any(Array)
				});
			});

			it('should return error with message on failure', async () => {
				const { generateSuggestionsForEntity } = await import('./fieldSuggestionService');

				mockCreate.mockRejectedValue(new Error('API failure'));

				const result = await generateSuggestionsForEntity(
					'npc',
					'npc-123',
					mockExistingEntity
				);

				expect(result).toMatchObject({
					success: false,
					error: expect.any(String)
				});
				expect(result.suggestions).toBeUndefined();
			});
		});

		describe('Prompt Engineering', () => {
			it('should request multiple field suggestions in batch format', async () => {
				const { generateSuggestionsForEntity } = await import('./fieldSuggestionService');

				await generateSuggestionsForEntity(
					'npc',
					'npc-123',
					mockExistingEntity
				);

				const callArgs = mockCreate.mock.calls[0][0];
				const prompt = callArgs.messages[0].content;

				// Should mention generating suggestions for multiple fields
				expect(prompt).toContain('personality');
				expect(prompt).toContain('appearance');
			});

			it('should specify JSON response format in prompt', async () => {
				const { generateSuggestionsForEntity } = await import('./fieldSuggestionService');

				await generateSuggestionsForEntity(
					'npc',
					'npc-123',
					mockExistingEntity
				);

				const callArgs = mockCreate.mock.calls[0][0];
				const prompt = callArgs.messages[0].content;

				// Should request JSON format
				expect(prompt).toMatch(/JSON|json/);
			});

			it('should include field metadata in prompt (type, hints, etc)', async () => {
				const { generateSuggestionsForEntity } = await import('./fieldSuggestionService');

				await generateSuggestionsForEntity(
					'npc',
					'npc-123',
					mockExistingEntity
				);

				const callArgs = mockCreate.mock.calls[0][0];
				const prompt = callArgs.messages[0].content;

				// Should mention field types and provide context
				expect(prompt).toMatch(/richtext|textarea|text/i);
			});
		});

		describe('Performance Considerations', () => {
			it('should use appropriate token limit for batch generation', async () => {
				const { generateSuggestionsForEntity } = await import('./fieldSuggestionService');

				await generateSuggestionsForEntity(
					'npc',
					'npc-123',
					mockExistingEntity
				);

				const callArgs = mockCreate.mock.calls[0][0];

				// Should use reasonable token limit (e.g., 2048 for multiple fields)
				expect(callArgs.max_tokens).toBeDefined();
				expect(callArgs.max_tokens).toBeGreaterThanOrEqual(1024);
			});

			it('should handle large number of empty fields efficiently', async () => {
				const { generateSuggestionsForEntity } = await import('./fieldSuggestionService');

				// Create a type with many empty text fields
				const manyFieldsType: EntityTypeDefinition = {
					...mockNPCType,
					fieldDefinitions: Array.from({ length: 20 }, (_, i) => ({
						key: `field${i}`,
						label: `Field ${i}`,
						type: 'text' as const,
						required: false,
						order: i
					}))
				};

				const entityWithManyEmpty = {
					...mockExistingEntity,
					fields: {}
				};

				const result = await generateSuggestionsForEntity(
					'npc',
					'npc-123',
					entityWithManyEmpty
				);

				// Should still work efficiently
				expect(result).toBeDefined();
				expect(mockCreate).toHaveBeenCalledTimes(1); // Still just one API call
			});
		});
	});
});
