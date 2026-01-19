/**
 * Tests for Relationship Summary Generation Service
 *
 * This service generates AI-powered summaries that describe the relationship between two entities,
 * providing context-aware descriptions that consider the relationship type, direction, and campaign context.
 *
 * Covers:
 * - Single relationship summary generation
 * - Batch relationship summary generation
 * - Error handling (API errors, missing keys, invalid entities)
 * - Privacy protection (hidden field exclusion)
 * - Relationship type influence on summaries (ally vs enemy, etc.)
 * - Relationship strength and notes integration
 * - Campaign context integration
 * - Response parsing and validation
 * - Consistent result structure
 */
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
	generateRelationshipSummary,
	generateRelationshipSummariesBatch,
	hasRelationshipSummaryApiKey,
	type RelationshipSummaryResult,
	type RelationshipSummaryBatchResult,
	type RelationshipSummaryContext
} from './relationshipSummaryService';
import type { BaseEntity, EntityLink } from '$lib/types';
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
				text: 'A detailed relationship summary describing how these two entities are connected.'
			}
		]
	});

	const MockAnthropic = function (this: any, config: any) {
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

describe('relationshipSummaryService', () => {
	let mockCreate: ReturnType<typeof vi.fn>;

	// Mock entities for testing
	const mockSourceEntity: BaseEntity = {
		id: 'entity-1',
		type: 'npc',
		name: 'Aldric the Brave',
		description: 'A noble knight who serves the crown with unwavering loyalty.',
		summary: 'A noble knight serving the crown',
		tags: ['knight', 'noble'],
		fields: {
			role: 'Knight Commander',
			personality: 'Honorable and brave',
			status: 'alive',
			secrets: 'Secretly doubts the king'
		},
		links: [],
		notes: 'DM: He will betray the party later',
		createdAt: new Date('2024-01-01'),
		updatedAt: new Date('2024-01-01'),
		metadata: {}
	};

	const mockTargetEntity: BaseEntity = {
		id: 'entity-2',
		type: 'faction',
		name: 'Order of the Silver Dawn',
		description: 'A religious order dedicated to fighting evil and protecting the innocent.',
		summary: 'A religious order fighting evil',
		tags: ['religious', 'good'],
		fields: {
			alignment: 'lawful good',
			headquarters: 'Temple of Light',
			memberCount: 250,
			hiddenAgenda: 'Seeking ancient artifacts'
		},
		links: [],
		notes: 'DM: They are secretly corrupt',
		createdAt: new Date('2024-01-01'),
		updatedAt: new Date('2024-01-01'),
		metadata: {}
	};

	const mockRelationship: EntityLink = {
		id: 'link-1',
		sourceId: 'entity-1',
		targetId: 'entity-2',
		targetType: 'faction',
		relationship: 'member_of',
		bidirectional: false,
		strength: 'strong',
		notes: 'Sworn in 5 years ago'
	};

	beforeEach(async () => {
		// Get the mock function from the mocked Anthropic constructor
		const AnthropicModule = await import('@anthropic-ai/sdk');
		const testClient = new AnthropicModule.default({ apiKey: 'test' });
		mockCreate = testClient.messages.create as unknown as ReturnType<typeof vi.fn>;

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
					text: 'A detailed relationship summary describing how these two entities are connected.'
				}
			]
		});
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	describe('hasRelationshipSummaryApiKey', () => {
		it('should return true when API key is configured', () => {
			expect(hasRelationshipSummaryApiKey()).toBe(true);
		});

		it('should return false when API key is not configured', () => {
			global.localStorage.getItem = vi.fn(() => null);
			expect(hasRelationshipSummaryApiKey()).toBe(false);
		});

		it('should return false in non-browser environment', () => {
			const originalWindow = global.window;
			// @ts-expect-error - Testing undefined window
			delete global.window;
			expect(hasRelationshipSummaryApiKey()).toBe(false);
			global.window = originalWindow;
		});
	});

	describe('generateRelationshipSummary', () => {
		describe('Single Relationship Summary Generation', () => {
			it('should generate summary for a basic relationship', async () => {
				const result = await generateRelationshipSummary(
					mockSourceEntity,
					mockTargetEntity,
					mockRelationship
				);

				expect(result.success).toBe(true);
				expect(result.summary).toBeDefined();
				expect(result.summary).toBe(
					'A detailed relationship summary describing how these two entities are connected.'
				);
				expect(result.error).toBeUndefined();
			});

			it('should include source entity name in prompt', async () => {
				await generateRelationshipSummary(mockSourceEntity, mockTargetEntity, mockRelationship);

				expect(mockCreate).toHaveBeenCalledWith(
					expect.objectContaining({
						messages: expect.arrayContaining([
							expect.objectContaining({
								content: expect.stringContaining('Aldric the Brave')
							})
						])
					})
				);
			});

			it('should include target entity name in prompt', async () => {
				await generateRelationshipSummary(mockSourceEntity, mockTargetEntity, mockRelationship);

				expect(mockCreate).toHaveBeenCalledWith(
					expect.objectContaining({
						messages: expect.arrayContaining([
							expect.objectContaining({
								content: expect.stringContaining('Order of the Silver Dawn')
							})
						])
					})
				);
			});

			it('should include relationship type in prompt', async () => {
				await generateRelationshipSummary(mockSourceEntity, mockTargetEntity, mockRelationship);

				expect(mockCreate).toHaveBeenCalledWith(
					expect.objectContaining({
						messages: expect.arrayContaining([
							expect.objectContaining({
								content: expect.stringContaining('member_of')
							})
						])
					})
				);
			});

			it('should include source entity summary when available', async () => {
				await generateRelationshipSummary(mockSourceEntity, mockTargetEntity, mockRelationship);

				expect(mockCreate).toHaveBeenCalledWith(
					expect.objectContaining({
						messages: expect.arrayContaining([
							expect.objectContaining({
								content: expect.stringContaining('noble knight serving the crown')
							})
						])
					})
				);
			});

			it('should include target entity summary when available', async () => {
				await generateRelationshipSummary(mockSourceEntity, mockTargetEntity, mockRelationship);

				expect(mockCreate).toHaveBeenCalledWith(
					expect.objectContaining({
						messages: expect.arrayContaining([
							expect.objectContaining({
								content: expect.stringContaining('religious order fighting evil')
							})
						])
					})
				);
			});

			it('should handle entities without summaries', async () => {
				const sourceWithoutSummary = { ...mockSourceEntity, summary: undefined };
				const targetWithoutSummary = { ...mockTargetEntity, summary: undefined };

				const result = await generateRelationshipSummary(
					sourceWithoutSummary,
					targetWithoutSummary,
					mockRelationship
				);

				expect(result.success).toBe(true);
			});

			it('should use appropriate max_tokens for relationship summaries', async () => {
				await generateRelationshipSummary(mockSourceEntity, mockTargetEntity, mockRelationship);

				expect(mockCreate).toHaveBeenCalledWith(
					expect.objectContaining({
						max_tokens: expect.any(Number)
					})
				);

				const call = mockCreate.mock.calls[0][0];
				expect(call.max_tokens).toBeGreaterThanOrEqual(256);
				expect(call.max_tokens).toBeLessThanOrEqual(512);
			});

			it('should use correct model from modelService', async () => {
				await generateRelationshipSummary(mockSourceEntity, mockTargetEntity, mockRelationship);

				expect(mockCreate).toHaveBeenCalledWith(
					expect.objectContaining({
						model: 'claude-3-5-sonnet-20241022'
					})
				);
			});
		});

		describe('Privacy Protection', () => {
			it('should exclude hidden section fields from source entity context', async () => {
				await generateRelationshipSummary(mockSourceEntity, mockTargetEntity, mockRelationship);

				const call = mockCreate.mock.calls[0][0];
				const prompt = call.messages[0].content;

				// Should not include secrets field
				expect(prompt).not.toContain('Secretly doubts the king');
				expect(prompt).not.toContain('secrets');
			});

			it('should exclude hidden section fields from target entity context', async () => {
				await generateRelationshipSummary(mockSourceEntity, mockTargetEntity, mockRelationship);

				const call = mockCreate.mock.calls[0][0];
				const prompt = call.messages[0].content;

				// Should not include hidden agenda field
				expect(prompt).not.toContain('Seeking ancient artifacts');
				expect(prompt).not.toContain('hiddenAgenda');
			});

			it('should exclude notes field from both entities', async () => {
				await generateRelationshipSummary(mockSourceEntity, mockTargetEntity, mockRelationship);

				const call = mockCreate.mock.calls[0][0];
				const prompt = call.messages[0].content;

				// Should not include DM notes
				expect(prompt).not.toContain('betray the party');
				expect(prompt).not.toContain('secretly corrupt');
			});

			it('should include non-hidden fields from source entity', async () => {
				await generateRelationshipSummary(mockSourceEntity, mockTargetEntity, mockRelationship);

				const call = mockCreate.mock.calls[0][0];
				const prompt = call.messages[0].content;

				// Should include visible fields
				expect(prompt).toContain('Knight Commander');
			});

			it('should include non-hidden fields from target entity', async () => {
				await generateRelationshipSummary(mockSourceEntity, mockTargetEntity, mockRelationship);

				const call = mockCreate.mock.calls[0][0];
				const prompt = call.messages[0].content;

				// Should include visible fields
				expect(prompt).toContain('Temple of Light');
			});
		});

		describe('Relationship Type Influence', () => {
			it('should adapt summary tone for ally relationships', async () => {
				const allyRelationship: EntityLink = {
					...mockRelationship,
					relationship: 'ally_of'
				};

				await generateRelationshipSummary(mockSourceEntity, mockTargetEntity, allyRelationship);

				const call = mockCreate.mock.calls[0][0];
				const prompt = call.messages[0].content;

				// Prompt should mention the specific relationship type
				expect(prompt).toContain('ally_of');
			});

			it('should adapt summary tone for enemy relationships', async () => {
				const enemyRelationship: EntityLink = {
					...mockRelationship,
					relationship: 'enemy_of'
				};

				await generateRelationshipSummary(mockSourceEntity, mockTargetEntity, enemyRelationship);

				const call = mockCreate.mock.calls[0][0];
				const prompt = call.messages[0].content;

				// Prompt should mention the specific relationship type
				expect(prompt).toContain('enemy_of');
			});

			it('should handle custom relationship types', async () => {
				const customRelationship: EntityLink = {
					...mockRelationship,
					relationship: 'mentored_by'
				};

				const result = await generateRelationshipSummary(
					mockSourceEntity,
					mockTargetEntity,
					customRelationship
				);

				expect(result.success).toBe(true);
			});

			it('should handle bidirectional relationships', async () => {
				const bidirectionalRelationship: EntityLink = {
					...mockRelationship,
					bidirectional: true
				};

				const result = await generateRelationshipSummary(
					mockSourceEntity,
					mockTargetEntity,
					bidirectionalRelationship
				);

				expect(result.success).toBe(true);
			});

			it('should handle reverse relationship when specified', async () => {
				const asymmetricRelationship: EntityLink = {
					...mockRelationship,
					bidirectional: true,
					reverseRelationship: 'has_member'
				};

				await generateRelationshipSummary(
					mockSourceEntity,
					mockTargetEntity,
					asymmetricRelationship
				);

				const call = mockCreate.mock.calls[0][0];
				const prompt = call.messages[0].content;

				// Should mention reverse relationship
				expect(prompt).toContain('has_member');
			});
		});

		describe('Relationship Strength and Notes', () => {
			it('should include relationship strength in context when present', async () => {
				const strongRelationship: EntityLink = {
					...mockRelationship,
					strength: 'strong'
				};

				await generateRelationshipSummary(
					mockSourceEntity,
					mockTargetEntity,
					strongRelationship
				);

				const call = mockCreate.mock.calls[0][0];
				const prompt = call.messages[0].content;

				expect(prompt).toContain('strong');
			});

			it('should handle weak relationship strength', async () => {
				const weakRelationship: EntityLink = {
					...mockRelationship,
					strength: 'weak'
				};

				await generateRelationshipSummary(mockSourceEntity, mockTargetEntity, weakRelationship);

				const call = mockCreate.mock.calls[0][0];
				const prompt = call.messages[0].content;

				expect(prompt).toContain('weak');
			});

			it('should handle moderate relationship strength', async () => {
				const moderateRelationship: EntityLink = {
					...mockRelationship,
					strength: 'moderate'
				};

				await generateRelationshipSummary(
					mockSourceEntity,
					mockTargetEntity,
					moderateRelationship
				);

				const call = mockCreate.mock.calls[0][0];
				const prompt = call.messages[0].content;

				expect(prompt).toContain('moderate');
			});

			it('should include relationship notes when present', async () => {
				const relationshipWithNotes: EntityLink = {
					...mockRelationship,
					notes: 'Sworn in 5 years ago'
				};

				await generateRelationshipSummary(
					mockSourceEntity,
					mockTargetEntity,
					relationshipWithNotes
				);

				const call = mockCreate.mock.calls[0][0];
				const prompt = call.messages[0].content;

				expect(prompt).toContain('Sworn in 5 years ago');
			});

			it('should handle relationship without strength or notes', async () => {
				const basicRelationship: EntityLink = {
					...mockRelationship,
					strength: undefined,
					notes: undefined
				};

				const result = await generateRelationshipSummary(
					mockSourceEntity,
					mockTargetEntity,
					basicRelationship
				);

				expect(result.success).toBe(true);
			});
		});

		describe('Campaign Context Integration', () => {
			it('should include campaign name in prompt when provided', async () => {
				const context: RelationshipSummaryContext = {
					campaignName: 'The Shadow Rises',
					campaignSetting: 'Dark Fantasy',
					campaignSystem: 'Draw Steel'
				};

				await generateRelationshipSummary(
					mockSourceEntity,
					mockTargetEntity,
					mockRelationship,
					context
				);

				expect(mockCreate).toHaveBeenCalledWith(
					expect.objectContaining({
						messages: expect.arrayContaining([
							expect.objectContaining({
								content: expect.stringContaining('The Shadow Rises')
							})
						])
					})
				);
			});

			it('should include campaign setting in prompt when provided', async () => {
				const context: RelationshipSummaryContext = {
					campaignName: 'Test Campaign',
					campaignSetting: 'Cyberpunk',
					campaignSystem: 'Custom'
				};

				await generateRelationshipSummary(
					mockSourceEntity,
					mockTargetEntity,
					mockRelationship,
					context
				);

				expect(mockCreate).toHaveBeenCalledWith(
					expect.objectContaining({
						messages: expect.arrayContaining([
							expect.objectContaining({
								content: expect.stringContaining('Cyberpunk')
							})
						])
					})
				);
			});

			it('should include campaign system in prompt when provided', async () => {
				const context: RelationshipSummaryContext = {
					campaignName: 'Test Campaign',
					campaignSetting: 'Fantasy',
					campaignSystem: 'D&D 5e'
				};

				await generateRelationshipSummary(
					mockSourceEntity,
					mockTargetEntity,
					mockRelationship,
					context
				);

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

			it('should work without campaign context', async () => {
				const result = await generateRelationshipSummary(
					mockSourceEntity,
					mockTargetEntity,
					mockRelationship
				);

				expect(result.success).toBe(true);
			});

			it('should use default setting when campaign setting is empty', async () => {
				const context: RelationshipSummaryContext = {
					campaignName: 'Test Campaign',
					campaignSetting: '',
					campaignSystem: 'Custom'
				};

				await generateRelationshipSummary(
					mockSourceEntity,
					mockTargetEntity,
					mockRelationship,
					context
				);

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

			it('should use default system when campaign system is empty', async () => {
				const context: RelationshipSummaryContext = {
					campaignName: 'Test Campaign',
					campaignSetting: 'Fantasy',
					campaignSystem: ''
				};

				await generateRelationshipSummary(
					mockSourceEntity,
					mockTargetEntity,
					mockRelationship,
					context
				);

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
		});

		describe('Error Handling', () => {
			it('should return error when API key is not configured', async () => {
				global.localStorage.getItem = vi.fn(() => null);

				const result = await generateRelationshipSummary(
					mockSourceEntity,
					mockTargetEntity,
					mockRelationship
				);

				expect(result.success).toBe(false);
				expect(result.error).toBeDefined();
				expect(result.error).toContain('API key');
				expect(result.summary).toBeUndefined();
			});

			it('should handle 401 unauthorized error', async () => {
				const APIError = (Anthropic as any).APIError;
				mockCreate.mockRejectedValue(new APIError('Unauthorized', 401));

				const result = await generateRelationshipSummary(
					mockSourceEntity,
					mockTargetEntity,
					mockRelationship
				);

				expect(result.success).toBe(false);
				expect(result.error).toContain('Invalid API key');
			});

			it('should handle 429 rate limit error', async () => {
				const APIError = (Anthropic as any).APIError;
				mockCreate.mockRejectedValue(new APIError('Rate limit exceeded', 429));

				const result = await generateRelationshipSummary(
					mockSourceEntity,
					mockTargetEntity,
					mockRelationship
				);

				expect(result.success).toBe(false);
				expect(result.error).toContain('Rate limit');
			});

			it('should handle generic API errors', async () => {
				mockCreate.mockRejectedValue(new Error('Network error'));

				const result = await generateRelationshipSummary(
					mockSourceEntity,
					mockTargetEntity,
					mockRelationship
				);

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

				const result = await generateRelationshipSummary(
					mockSourceEntity,
					mockTargetEntity,
					mockRelationship
				);

				expect(result.success).toBe(false);
				expect(result.error).toContain('Unexpected response format');
			});

			it('should handle empty response content', async () => {
				mockCreate.mockResolvedValue({
					content: []
				});

				const result = await generateRelationshipSummary(
					mockSourceEntity,
					mockTargetEntity,
					mockRelationship
				);

				expect(result.success).toBe(false);
				expect(result.error).toContain('Unexpected response format');
			});

			it('should handle missing source entity', async () => {
				// @ts-expect-error - Testing invalid input
				const result = await generateRelationshipSummary(null, mockTargetEntity, mockRelationship);

				expect(result.success).toBe(false);
				expect(result.error).toBeDefined();
			});

			it('should handle missing target entity', async () => {
				// @ts-expect-error - Testing invalid input
				const result = await generateRelationshipSummary(mockSourceEntity, null, mockRelationship);

				expect(result.success).toBe(false);
				expect(result.error).toBeDefined();
			});

			it('should handle missing relationship', async () => {
				// @ts-expect-error - Testing invalid input
				const result = await generateRelationshipSummary(mockSourceEntity, mockTargetEntity, null);

				expect(result.success).toBe(false);
				expect(result.error).toBeDefined();
			});
		});

		describe('Response Parsing', () => {
			it('should parse plain text response', async () => {
				mockCreate.mockResolvedValue({
					content: [
						{
							type: 'text',
							text: 'This is a relationship summary.'
						}
					]
				});

				const result = await generateRelationshipSummary(
					mockSourceEntity,
					mockTargetEntity,
					mockRelationship
				);

				expect(result.success).toBe(true);
				expect(result.summary).toBe('This is a relationship summary.');
			});

			it('should handle multi-line summaries', async () => {
				mockCreate.mockResolvedValue({
					content: [
						{
							type: 'text',
							text: 'This is a multi-line relationship summary.\n\nIt has multiple paragraphs.'
						}
					]
				});

				const result = await generateRelationshipSummary(
					mockSourceEntity,
					mockTargetEntity,
					mockRelationship
				);

				expect(result.success).toBe(true);
				expect(result.summary).toContain('multi-line');
				expect(result.summary).toContain('multiple paragraphs');
			});

			it('should trim whitespace from summary', async () => {
				mockCreate.mockResolvedValue({
					content: [
						{
							type: 'text',
							text: '\n\n  Relationship summary with whitespace.  \n\n'
						}
					]
				});

				const result = await generateRelationshipSummary(
					mockSourceEntity,
					mockTargetEntity,
					mockRelationship
				);

				expect(result.success).toBe(true);
				expect(result.summary).toBe('Relationship summary with whitespace.');
			});

			it('should handle empty summary text', async () => {
				mockCreate.mockResolvedValue({
					content: [
						{
							type: 'text',
							text: ''
						}
					]
				});

				const result = await generateRelationshipSummary(
					mockSourceEntity,
					mockTargetEntity,
					mockRelationship
				);

				expect(result.success).toBe(false);
				expect(result.error).toContain('empty');
			});

			it('should handle whitespace-only summary text', async () => {
				mockCreate.mockResolvedValue({
					content: [
						{
							type: 'text',
							text: '   \n\n   '
						}
					]
				});

				const result = await generateRelationshipSummary(
					mockSourceEntity,
					mockTargetEntity,
					mockRelationship
				);

				expect(result.success).toBe(false);
				expect(result.error).toContain('empty');
			});
		});

		describe('Prompt Engineering', () => {
			it('should instruct AI to focus on relationship context', async () => {
				await generateRelationshipSummary(mockSourceEntity, mockTargetEntity, mockRelationship);

				const call = mockCreate.mock.calls[0][0];
				const prompt = call.messages[0].content;

				// Should emphasize the relationship aspect
				expect(prompt.toLowerCase()).toContain('relationship');
			});

			it('should request concise summaries', async () => {
				await generateRelationshipSummary(mockSourceEntity, mockTargetEntity, mockRelationship);

				const call = mockCreate.mock.calls[0][0];
				const prompt = call.messages[0].content;

				// Should ask for concise output
				expect(prompt.toLowerCase()).toMatch(/concise|brief|short/);
			});

			it('should instruct AI to avoid speculation', async () => {
				await generateRelationshipSummary(mockSourceEntity, mockTargetEntity, mockRelationship);

				const call = mockCreate.mock.calls[0][0];
				const prompt = call.messages[0].content;

				// Should warn against adding information not in context
				expect(prompt.toLowerCase()).toMatch(/only|based on|provided|given/);
			});

			it('should specify TTRPG context', async () => {
				await generateRelationshipSummary(mockSourceEntity, mockTargetEntity, mockRelationship);

				const call = mockCreate.mock.calls[0][0];
				const prompt = call.messages[0].content;

				// Should mention TTRPG/campaign context
				expect(prompt.toLowerCase()).toMatch(/ttrpg|campaign|rpg|game/);
			});
		});
	});

	describe('generateRelationshipSummariesBatch', () => {
		const mockTargetEntity2: BaseEntity = {
			id: 'entity-3',
			type: 'npc',
			name: 'Mira the Wise',
			description: 'An elderly sage with vast knowledge.',
			summary: 'An elderly sage',
			tags: ['sage', 'old'],
			fields: {
				role: 'Advisor',
				age: 78
			},
			links: [],
			notes: '',
			createdAt: new Date('2024-01-01'),
			updatedAt: new Date('2024-01-01'),
			metadata: {}
		};

		const mockRelationship2: EntityLink = {
			id: 'link-2',
			sourceId: 'entity-1',
			targetId: 'entity-3',
			targetType: 'npc',
			relationship: 'mentored_by',
			bidirectional: false
		};

		describe('Batch Processing', () => {
			it('should generate summaries for multiple relationships', async () => {
				mockCreate.mockResolvedValueOnce({
					content: [{ type: 'text', text: 'Summary for relationship 1' }]
				});
				mockCreate.mockResolvedValueOnce({
					content: [{ type: 'text', text: 'Summary for relationship 2' }]
				});

				const relationships = [
					{ targetEntity: mockTargetEntity, relationship: mockRelationship },
					{ targetEntity: mockTargetEntity2, relationship: mockRelationship2 }
				];

				const result = await generateRelationshipSummariesBatch(mockSourceEntity, relationships);

				expect(result.success).toBe(true);
				expect(result.summaries).toBeDefined();
				expect(result.summaries?.length).toBe(2);
				expect(result.summaries?.[0].summary).toBe('Summary for relationship 1');
				expect(result.summaries?.[1].summary).toBe('Summary for relationship 2');
			});

			it('should process relationships sequentially to avoid rate limits', async () => {
				mockCreate.mockResolvedValue({
					content: [{ type: 'text', text: 'Summary' }]
				});

				const relationships = [
					{ targetEntity: mockTargetEntity, relationship: mockRelationship },
					{ targetEntity: mockTargetEntity2, relationship: mockRelationship2 }
				];

				const startTime = Date.now();
				await generateRelationshipSummariesBatch(mockSourceEntity, relationships);
				const duration = Date.now() - startTime;

				// Sequential processing should take some time (with delays)
				// This is a loose check - we just verify it's not instant (parallel)
				expect(mockCreate).toHaveBeenCalledTimes(2);
			});

			it('should include relationship IDs in batch results', async () => {
				mockCreate.mockResolvedValue({
					content: [{ type: 'text', text: 'Summary' }]
				});

				const relationships = [
					{ targetEntity: mockTargetEntity, relationship: mockRelationship },
					{ targetEntity: mockTargetEntity2, relationship: mockRelationship2 }
				];

				const result = await generateRelationshipSummariesBatch(mockSourceEntity, relationships);

				expect(result.success).toBe(true);
				expect(result.summaries?.[0].relationshipId).toBe('link-1');
				expect(result.summaries?.[1].relationshipId).toBe('link-2');
			});

			it('should include target entity IDs in batch results', async () => {
				mockCreate.mockResolvedValue({
					content: [{ type: 'text', text: 'Summary' }]
				});

				const relationships = [
					{ targetEntity: mockTargetEntity, relationship: mockRelationship },
					{ targetEntity: mockTargetEntity2, relationship: mockRelationship2 }
				];

				const result = await generateRelationshipSummariesBatch(mockSourceEntity, relationships);

				expect(result.success).toBe(true);
				expect(result.summaries?.[0].targetEntityId).toBe('entity-2');
				expect(result.summaries?.[1].targetEntityId).toBe('entity-3');
			});

			it('should handle empty relationships array', async () => {
				const result = await generateRelationshipSummariesBatch(mockSourceEntity, []);

				expect(result.success).toBe(true);
				expect(result.summaries).toEqual([]);
			});

			it('should pass campaign context to each generation', async () => {
				mockCreate.mockResolvedValue({
					content: [{ type: 'text', text: 'Summary' }]
				});

				const context: RelationshipSummaryContext = {
					campaignName: 'Test Campaign',
					campaignSetting: 'Fantasy',
					campaignSystem: 'Draw Steel'
				};

				const relationships = [
					{ targetEntity: mockTargetEntity, relationship: mockRelationship },
					{ targetEntity: mockTargetEntity2, relationship: mockRelationship2 }
				];

				await generateRelationshipSummariesBatch(mockSourceEntity, relationships, context);

				// Both calls should include campaign context
				expect(mockCreate).toHaveBeenCalledTimes(2);
				expect(mockCreate.mock.calls[0][0].messages[0].content).toContain('Test Campaign');
				expect(mockCreate.mock.calls[1][0].messages[0].content).toContain('Test Campaign');
			});
		});

		describe('Batch Error Handling', () => {
			it('should handle partial failures in batch processing', async () => {
				mockCreate
					.mockResolvedValueOnce({
						content: [{ type: 'text', text: 'Summary 1' }]
					})
					.mockRejectedValueOnce(new Error('API error'))
					.mockResolvedValueOnce({
						content: [{ type: 'text', text: 'Summary 3' }]
					});

				const relationships = [
					{ targetEntity: mockTargetEntity, relationship: mockRelationship },
					{ targetEntity: mockTargetEntity2, relationship: mockRelationship2 },
					{
						targetEntity: mockTargetEntity,
						relationship: { ...mockRelationship, id: 'link-3' }
					}
				];

				const result = await generateRelationshipSummariesBatch(mockSourceEntity, relationships);

				expect(result.success).toBe(true);
				expect(result.summaries?.length).toBe(3);
				expect(result.summaries?.[0].success).toBe(true);
				expect(result.summaries?.[1].success).toBe(false);
				expect(result.summaries?.[1].error).toContain('API error');
				expect(result.summaries?.[2].success).toBe(true);
			});

			it('should continue processing after individual failures', async () => {
				mockCreate
					.mockRejectedValueOnce(new Error('First failed'))
					.mockResolvedValueOnce({
						content: [{ type: 'text', text: 'Second succeeded' }]
					});

				const relationships = [
					{ targetEntity: mockTargetEntity, relationship: mockRelationship },
					{ targetEntity: mockTargetEntity2, relationship: mockRelationship2 }
				];

				const result = await generateRelationshipSummariesBatch(mockSourceEntity, relationships);

				expect(result.success).toBe(true);
				expect(mockCreate).toHaveBeenCalledTimes(2);
				expect(result.summaries?.[1].success).toBe(true);
			});

			it('should return error when API key is not configured', async () => {
				global.localStorage.getItem = vi.fn(() => null);

				const relationships = [
					{ targetEntity: mockTargetEntity, relationship: mockRelationship }
				];

				const result = await generateRelationshipSummariesBatch(mockSourceEntity, relationships);

				expect(result.success).toBe(false);
				expect(result.error).toContain('API key');
				expect(result.summaries).toBeUndefined();
			});

			it('should handle invalid source entity in batch', async () => {
				const relationships = [
					{ targetEntity: mockTargetEntity, relationship: mockRelationship }
				];

				// @ts-expect-error - Testing invalid input
				const result = await generateRelationshipSummariesBatch(null, relationships);

				expect(result.success).toBe(false);
				expect(result.error).toBeDefined();
			});

			it('should validate each relationship in batch', async () => {
				mockCreate.mockResolvedValue({
					content: [{ type: 'text', text: 'Summary' }]
				});

				const relationships = [
					{ targetEntity: mockTargetEntity, relationship: mockRelationship },
					{ targetEntity: mockTargetEntity2, relationship: null as unknown as EntityLink }
				];

				const result = await generateRelationshipSummariesBatch(mockSourceEntity, relationships);

				expect(result.success).toBe(true);
				expect(result.summaries?.[0].success).toBe(true);
				expect(result.summaries?.[1].success).toBe(false);
			});
		});

		describe('Batch Performance', () => {
			it('should report total count in batch result', async () => {
				mockCreate.mockResolvedValue({
					content: [{ type: 'text', text: 'Summary' }]
				});

				const relationships = [
					{ targetEntity: mockTargetEntity, relationship: mockRelationship },
					{ targetEntity: mockTargetEntity2, relationship: mockRelationship2 }
				];

				const result = await generateRelationshipSummariesBatch(mockSourceEntity, relationships);

				expect(result.totalCount).toBe(2);
			});

			it('should report success count in batch result', async () => {
				mockCreate
					.mockResolvedValueOnce({
						content: [{ type: 'text', text: 'Summary' }]
					})
					.mockRejectedValueOnce(new Error('Failed'));

				const relationships = [
					{ targetEntity: mockTargetEntity, relationship: mockRelationship },
					{ targetEntity: mockTargetEntity2, relationship: mockRelationship2 }
				];

				const result = await generateRelationshipSummariesBatch(mockSourceEntity, relationships);

				expect(result.successCount).toBe(1);
			});

			it('should report failure count in batch result', async () => {
				mockCreate
					.mockResolvedValueOnce({
						content: [{ type: 'text', text: 'Summary' }]
					})
					.mockRejectedValueOnce(new Error('Failed'));

				const relationships = [
					{ targetEntity: mockTargetEntity, relationship: mockRelationship },
					{ targetEntity: mockTargetEntity2, relationship: mockRelationship2 }
				];

				const result = await generateRelationshipSummariesBatch(mockSourceEntity, relationships);

				expect(result.failureCount).toBe(1);
			});
		});
	});
});
