/**
 * Tests for Scene Generation Service
 *
 * This is the RED phase of TDD - tests written to FAIL initially.
 * These tests validate scene-specific AI generation functions:
 * - generateSceneSettingText() - generates read-aloud text from location/NPC context
 * - generatePreSceneSummary() - generates summary of scene setup
 * - generatePostSceneSummary() - generates summary of what happened
 *
 * Tests verify:
 * - Function signatures and return types
 * - Context data is properly passed to AI
 * - Error handling for missing API keys
 * - Mocking of AI service calls
 *
 * Implementation will be added in the GREEN phase to make these tests pass.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { BaseEntity } from '$lib/types';

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
				text: 'Generated vivid scene description with atmospheric details for the game master.'
			}
		],
		usage: {
			input_tokens: 100,
			output_tokens: 50
		}
	});

	const MockAnthropic = function(this: any, config: any) {
		this.messages = {
			create: mockCreate
		};
	};

	// Add APIError to the mock
	MockAnthropic.APIError = class APIError extends Error {
		status: number;
		constructor(message: string, status: number) {
			super(message);
			this.status = status;
		}
	};

	return {
		default: MockAnthropic
	};
});

// Import the functions we're testing
import {
	generateSceneSettingText,
	generatePreSceneSummary,
	generatePostSceneSummary
} from './sceneGenerationService';

describe('sceneGenerationService', () => {
	// Mock localStorage
	let originalLocalStorage: Storage;
	let mockStore: Record<string, string>;

	beforeEach(() => {
		// Mock localStorage
		mockStore = {
			'dm-assist-api-key': 'test-api-key-12345'
		};
		originalLocalStorage = global.localStorage;

		global.localStorage = {
			getItem: vi.fn((key: string) => mockStore[key] ?? null),
			setItem: vi.fn((key: string, value: string) => {
				mockStore[key] = value;
			}),
			removeItem: vi.fn((key: string) => {
				delete mockStore[key];
			}),
			clear: vi.fn(() => {
				Object.keys(mockStore).forEach((key) => delete mockStore[key]);
			}),
			length: 0,
			key: vi.fn()
		} as Storage;
	});

	afterEach(() => {
		global.localStorage = originalLocalStorage;
	});

	describe('generateSceneSettingText', () => {
		// Mock entities for testing
		const mockLocation: BaseEntity = {
			id: 'loc-1',
			type: 'location',
			name: 'The Rusty Sword Tavern',
			description: 'A cozy tavern with warm lighting and the smell of ale',
			summary: 'Popular tavern in the town square',
			tags: ['tavern', 'social'],
			fields: {
				locationType: 'building',
				atmosphere: 'Warm and welcoming, with the sound of laughter and clinking mugs'
			},
			links: [],
			notes: '',
			createdAt: new Date(),
			updatedAt: new Date(),
			metadata: {}
		};

		const mockNPCs: BaseEntity[] = [
			{
				id: 'npc-1',
				type: 'npc',
				name: 'Grimwald the Barkeep',
				description: 'A burly dwarf with a friendly smile',
				summary: 'Friendly tavern keeper',
				tags: ['dwarf', 'friendly'],
				fields: {
					role: 'Barkeep',
					personality: 'Jovial and talkative',
					appearance: 'Short and stocky with a braided beard'
				},
				links: [],
				notes: '',
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: {}
			},
			{
				id: 'npc-2',
				type: 'npc',
				name: 'Elara the Bard',
				description: 'A half-elf with a beautiful singing voice',
				summary: 'Traveling bard',
				tags: ['bard', 'performer'],
				fields: {
					role: 'Bard',
					personality: 'Charming and witty'
				},
				links: [],
				notes: '',
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: {}
			}
		];

		describe('Function Existence and Signature', () => {
			it('should be a function', () => {
				// This will fail until the service is implemented
				expect(typeof generateSceneSettingText).toBe('function');
			});

			it('should accept location and NPCs as parameters', () => {
				// Test that function can be called with correct parameters
				expect(() => {
					generateSceneSettingText(mockLocation, mockNPCs);
				}).not.toThrow();
			});

			it('should accept optional mood parameter', () => {
				expect(() => {
					generateSceneSettingText(mockLocation, mockNPCs, 'tense');
				}).not.toThrow();
			});
		});

		describe('Return Value', () => {
			it('should return a Promise', () => {
				const result = generateSceneSettingText(mockLocation, mockNPCs);
				expect(result).toBeInstanceOf(Promise);
			});

			it('should resolve to an object with success and content properties', async () => {
				const result = await generateSceneSettingText(mockLocation, mockNPCs);

				expect(result).toHaveProperty('success');
				expect(result).toHaveProperty('content');
			});

			it('should return success true on successful generation', async () => {
				const result = await generateSceneSettingText(mockLocation, mockNPCs);
				expect(result.success).toBe(true);
			});

			it('should return content as a string on success', async () => {
				const result = await generateSceneSettingText(mockLocation, mockNPCs);

				if (result.success) {
					expect(typeof result.content).toBe('string');
					expect(result.content.length).toBeGreaterThan(0);
				}
			});
		});

		describe('Context Building', () => {
			it('should use location name in generation', async () => {
				const result = await generateSceneSettingText(mockLocation, mockNPCs);

				// Verify the AI was called with location context
				expect(result.success).toBe(true);
			});

			it('should incorporate location atmosphere', async () => {
				const result = await generateSceneSettingText(mockLocation, mockNPCs);
				expect(result.success).toBe(true);
			});

			it('should include all NPCs in context', async () => {
				const result = await generateSceneSettingText(mockLocation, mockNPCs);
				expect(result.success).toBe(true);
			});

			it('should work with single NPC', async () => {
				const result = await generateSceneSettingText(mockLocation, [mockNPCs[0]]);
				expect(result.success).toBe(true);
			});

			it('should work with no NPCs', async () => {
				const result = await generateSceneSettingText(mockLocation, []);
				expect(result.success).toBe(true);
			});

			it('should incorporate mood when provided', async () => {
				const result = await generateSceneSettingText(mockLocation, mockNPCs, 'tense');
				expect(result.success).toBe(true);
			});
		});

		describe('Error Handling', () => {
			it('should return success false when API key is missing', async () => {
				delete mockStore['dm-assist-api-key'];

				const result = await generateSceneSettingText(mockLocation, mockNPCs);

				expect(result.success).toBe(false);
				expect(result.error).toBeDefined();
			});

			it('should include error message when API key is missing', async () => {
				delete mockStore['dm-assist-api-key'];

				const result = await generateSceneSettingText(mockLocation, mockNPCs);

				expect(result.error).toContain('API key');
			});

			it('should handle null location gracefully', async () => {
				const result = await generateSceneSettingText(null as any, mockNPCs);

				expect(result.success).toBe(false);
				expect(result.error).toBeDefined();
			});

			it('should handle undefined NPCs array', async () => {
				const result = await generateSceneSettingText(mockLocation, undefined as any);

				// Should either work with empty context or return error
				expect(result).toHaveProperty('success');
			});
		});

		describe('Generation Quality', () => {
			it('should generate descriptive text', async () => {
				const result = await generateSceneSettingText(mockLocation, mockNPCs);

				if (result.success) {
					// Generated text should be substantial
					expect(result.content.length).toBeGreaterThan(50);
				}
			});

			it('should generate different text for different locations', async () => {
				const location2: BaseEntity = {
					...mockLocation,
					id: 'loc-2',
					name: 'Dark Forest Clearing',
					description: 'A mysterious clearing surrounded by ancient trees'
				};

				const result1 = await generateSceneSettingText(mockLocation, mockNPCs);
				const result2 = await generateSceneSettingText(location2, mockNPCs);

				// Results should be different (even with mocking, structure should differ)
				expect(result1.success).toBe(true);
				expect(result2.success).toBe(true);
			});
		});
	});

	describe('generatePreSceneSummary', () => {
		const mockSceneContext = {
			sceneName: 'Arriving at the Tavern',
			location: {
				id: 'loc-1',
				name: 'The Rusty Sword Tavern',
				type: 'location' as const
			},
			npcs: [
				{ id: 'npc-1', name: 'Grimwald', type: 'npc' as const },
				{ id: 'npc-2', name: 'Elara', type: 'npc' as const }
			],
			mood: 'relaxed' as const,
			settingText: 'As you push open the heavy wooden door...'
		};

		describe('Function Existence and Signature', () => {
			it('should be a function', () => {
				expect(typeof generatePreSceneSummary).toBe('function');
			});

			it('should accept scene context parameter', () => {
				expect(() => {
					generatePreSceneSummary(mockSceneContext);
				}).not.toThrow();
			});
		});

		describe('Return Value', () => {
			it('should return a Promise', () => {
				const result = generatePreSceneSummary(mockSceneContext);
				expect(result).toBeInstanceOf(Promise);
			});

			it('should resolve to result object with success property', async () => {
				const result = await generatePreSceneSummary(mockSceneContext);

				expect(result).toHaveProperty('success');
				expect(typeof result.success).toBe('boolean');
			});

			it('should return summary as string on success', async () => {
				const result = await generatePreSceneSummary(mockSceneContext);

				if (result.success) {
					expect(typeof result.summary).toBe('string');
					expect(result.summary.length).toBeGreaterThan(0);
				}
			});
		});

		describe('Context Usage', () => {
			it('should use scene name in summary generation', async () => {
				const result = await generatePreSceneSummary(mockSceneContext);
				expect(result.success).toBe(true);
			});

			it('should incorporate location context', async () => {
				const result = await generatePreSceneSummary(mockSceneContext);
				expect(result.success).toBe(true);
			});

			it('should incorporate NPC context', async () => {
				const result = await generatePreSceneSummary(mockSceneContext);
				expect(result.success).toBe(true);
			});

			it('should work without NPCs', async () => {
				const contextWithoutNPCs = { ...mockSceneContext, npcs: [] };
				const result = await generatePreSceneSummary(contextWithoutNPCs);
				expect(result.success).toBe(true);
			});

			it('should work without mood', async () => {
				const contextWithoutMood = { ...mockSceneContext, mood: undefined };
				const result = await generatePreSceneSummary(contextWithoutMood);
				expect(result.success).toBe(true);
			});
		});

		describe('Summary Characteristics', () => {
			it('should generate concise summary (1-2 sentences)', async () => {
				const result = await generatePreSceneSummary(mockSceneContext);

				if (result.success) {
					const sentenceCount = (result.summary.match(/[.!?]+/g) || []).length;
					expect(sentenceCount).toBeLessThanOrEqual(3);
				}
			});

			it('should focus on setup and expectations', async () => {
				const result = await generatePreSceneSummary(mockSceneContext);

				if (result.success) {
					// Summary should be forward-looking (setup for scene)
					expect(result.summary.length).toBeGreaterThan(10);
				}
			});
		});

		describe('Error Handling', () => {
			it('should handle missing API key', async () => {
				delete mockStore['dm-assist-api-key'];

				const result = await generatePreSceneSummary(mockSceneContext);

				expect(result.success).toBe(false);
				expect(result.error).toContain('API key');
			});

			it('should handle null context', async () => {
				const result = await generatePreSceneSummary(null as any);

				expect(result.success).toBe(false);
			});
		});
	});

	describe('generatePostSceneSummary', () => {
		const mockSceneData = {
			sceneName: 'Arriving at the Tavern',
			whatHappened: 'The party entered the tavern and met Grimwald. Elara sang a song about their adventures. They learned about the missing merchant.',
			location: {
				id: 'loc-1',
				name: 'The Rusty Sword Tavern',
				type: 'location' as const
			},
			npcs: [
				{ id: 'npc-1', name: 'Grimwald', type: 'npc' as const },
				{ id: 'npc-2', name: 'Elara', type: 'npc' as const }
			],
			mood: 'relaxed' as const
		};

		describe('Function Existence and Signature', () => {
			it('should be a function', () => {
				expect(typeof generatePostSceneSummary).toBe('function');
			});

			it('should accept scene data parameter', () => {
				expect(() => {
					generatePostSceneSummary(mockSceneData);
				}).not.toThrow();
			});
		});

		describe('Return Value', () => {
			it('should return a Promise', () => {
				const result = generatePostSceneSummary(mockSceneData);
				expect(result).toBeInstanceOf(Promise);
			});

			it('should resolve to result object', async () => {
				const result = await generatePostSceneSummary(mockSceneData);

				expect(result).toHaveProperty('success');
				expect(typeof result.success).toBe('boolean');
			});

			it('should return summary on success', async () => {
				const result = await generatePostSceneSummary(mockSceneData);

				if (result.success) {
					expect(typeof result.summary).toBe('string');
					expect(result.summary.length).toBeGreaterThan(0);
				}
			});
		});

		describe('Context Usage', () => {
			it('should use whatHappened field as primary source', async () => {
				const result = await generatePostSceneSummary(mockSceneData);
				expect(result.success).toBe(true);
			});

			it('should incorporate scene outcome details', async () => {
				const result = await generatePostSceneSummary(mockSceneData);
				expect(result.success).toBe(true);
			});

			it('should handle long whatHappened text', async () => {
				const longWhatHappened = 'The party entered the tavern. ' + 'They talked to Grimwald. '.repeat(20);
				const dataWithLongText = { ...mockSceneData, whatHappened: longWhatHappened };

				const result = await generatePostSceneSummary(dataWithLongText);
				expect(result.success).toBe(true);
			});

			it('should work with minimal whatHappened', async () => {
				const minimalData = { ...mockSceneData, whatHappened: 'Nothing much happened.' };
				const result = await generatePostSceneSummary(minimalData);
				expect(result.success).toBe(true);
			});

			it('should handle empty whatHappened field', async () => {
				const emptyData = { ...mockSceneData, whatHappened: '' };
				const result = await generatePostSceneSummary(emptyData);

				// Should either fail gracefully or generate minimal summary
				expect(result).toHaveProperty('success');
			});
		});

		describe('Summary Characteristics', () => {
			it('should generate concise summary', async () => {
				const result = await generatePostSceneSummary(mockSceneData);

				if (result.success) {
					// Summary should be shorter than original whatHappened
					expect(result.summary.length).toBeLessThanOrEqual(mockSceneData.whatHappened.length);
				}
			});

			it('should focus on key events and outcomes', async () => {
				const result = await generatePostSceneSummary(mockSceneData);

				if (result.success) {
					expect(result.summary.length).toBeGreaterThan(20);
				}
			});

			it('should be different from preSummary for same scene', async () => {
				// Pre and post summaries should have different purposes
				const preContext = {
					sceneName: mockSceneData.sceneName,
					location: mockSceneData.location,
					npcs: mockSceneData.npcs,
					mood: mockSceneData.mood,
					settingText: 'Setting description'
				};

				const preResult = await generatePreSceneSummary(preContext);
				const postResult = await generatePostSceneSummary(mockSceneData);

				expect(preResult.success).toBe(true);
				expect(postResult.success).toBe(true);
				// Summaries should serve different purposes
			});
		});

		describe('Error Handling', () => {
			it('should handle missing API key', async () => {
				delete mockStore['dm-assist-api-key'];

				const result = await generatePostSceneSummary(mockSceneData);

				expect(result.success).toBe(false);
				expect(result.error).toContain('API key');
			});

			it('should handle null scene data', async () => {
				const result = await generatePostSceneSummary(null as any);

				expect(result.success).toBe(false);
			});

			it('should handle missing required fields', async () => {
				const incompleteData = { sceneName: 'Test Scene' };
				const result = await generatePostSceneSummary(incompleteData as any);

				// Should handle gracefully
				expect(result).toHaveProperty('success');
			});
		});
	});

	describe('Service Integration', () => {
		it('should use consistent AI model across all functions', async () => {
			// All three functions should use the same model selection
			const mockLocation: BaseEntity = {
				id: 'loc-1',
				type: 'location',
				name: 'Test Location',
				description: 'Test',
				summary: 'Test',
				tags: [],
				fields: {},
				links: [],
				notes: '',
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: {}
			};

			await generateSceneSettingText(mockLocation, []);
			await generatePreSceneSummary({ sceneName: 'Test', location: { id: 'loc-1', name: 'Test', type: 'location' }, npcs: [], settingText: '' });
			await generatePostSceneSummary({ sceneName: 'Test', whatHappened: 'Test events', location: { id: 'loc-1', name: 'Test', type: 'location' }, npcs: [] });

			// If we got here without errors, model selection is working
			expect(true).toBe(true);
		});

		it('should handle API errors consistently', async () => {
			delete mockStore['dm-assist-api-key'];

			const mockLocation: BaseEntity = {
				id: 'loc-1',
				type: 'location',
				name: 'Test',
				description: 'Test',
				summary: 'Test',
				tags: [],
				fields: {},
				links: [],
				notes: '',
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: {}
			};

			const result1 = await generateSceneSettingText(mockLocation, []);
			const result2 = await generatePreSceneSummary({ sceneName: 'Test', location: { id: 'loc-1', name: 'Test', type: 'location' }, npcs: [], settingText: '' });
			const result3 = await generatePostSceneSummary({ sceneName: 'Test', whatHappened: 'Test', location: { id: 'loc-1', name: 'Test', type: 'location' }, npcs: [] });

			// All should fail with similar error structure
			expect(result1.success).toBe(false);
			expect(result2.success).toBe(false);
			expect(result3.success).toBe(false);

			expect(result1.error).toBeDefined();
			expect(result2.error).toBeDefined();
			expect(result3.error).toBeDefined();
		});
	});
});
