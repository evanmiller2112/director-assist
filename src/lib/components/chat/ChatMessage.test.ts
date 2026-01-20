/**
 * Tests for ChatMessage Component - Entity Detection Integration (TDD RED Phase - Phase A3)
 *
 * This test file focuses on the entity detection features added to ChatMessage:
 * - Parsing assistant messages for entities
 * - NOT parsing user messages
 * - Rendering EntityDetectionIndicator when entities found
 * - Not rendering indicator when no entities found
 *
 * These tests should FAIL initially as the entity detection features don't exist yet.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import ChatMessage from './ChatMessage.svelte';
import type { ChatMessage as Message } from '$lib/types';
import type { ParsedEntity } from '$lib/services/entityParserService';

// Mock the entity parser service
vi.mock('$lib/services/entityParserService', () => ({
	parseAIResponse: vi.fn()
}));

// Don't mock EntityDetectionIndicator - we test the real integration

import { parseAIResponse } from '$lib/services/entityParserService';

describe('ChatMessage Component - Entity Detection', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('User Messages - No Entity Parsing', () => {
		it('should NOT parse user messages for entities', () => {
			const userMessage: Message = {
				id: 'msg-1',
				role: 'user',
				content: 'Create an NPC named Captain Aldric',
				timestamp: new Date(),
				conversationId: 'conv-1'
			};

			render(ChatMessage, {
				props: {
					message: userMessage
				}
			});

			// parseAIResponse should NOT be called for user messages
			expect(parseAIResponse).not.toHaveBeenCalled();
		});

		it('should display user message content normally', () => {
			const userMessage: Message = {
				id: 'msg-1',
				role: 'user',
				content: 'Create an NPC named Captain Aldric',
				timestamp: new Date(),
				conversationId: 'conv-1'
			};

			render(ChatMessage, {
				props: {
					message: userMessage
				}
			});

			expect(screen.getByText('Create an NPC named Captain Aldric')).toBeInTheDocument();
		});

		it('should NOT render EntityDetectionIndicator for user messages', () => {
			const userMessage: Message = {
				id: 'msg-1',
				role: 'user',
				content: '## Captain Aldric\n\n**Role**: Guard Captain',
				timestamp: new Date(),
				conversationId: 'conv-1'
			};

			const { container } = render(ChatMessage, {
				props: {
					message: userMessage
				}
			});

			// EntityDetectionIndicator should not be rendered
			// (No entity detection badge should appear)
		});
	});

	describe('Assistant Messages - Entity Parsing', () => {
		it('should parse assistant messages for entities', () => {
			const assistantMessage: Message = {
				id: 'msg-2',
				role: 'assistant',
				content: '## Captain Aldric\n\n**Role**: Guard Captain\n**Personality**: Stern',
				timestamp: new Date(),
				conversationId: 'conv-1'
			};

			const mockParsedEntity: ParsedEntity = {
				entityType: 'npc',
				confidence: 0.85,
				name: 'Captain Aldric',
				description: 'Stern guard captain',
				tags: [],
				fields: { role: 'Guard Captain', personality: 'Stern' },
				validationErrors: {}
			};

			vi.mocked(parseAIResponse).mockReturnValue({
				entities: [mockParsedEntity],
				hasMultiple: false,
				rawText: assistantMessage.content,
				errors: []
			});

			render(ChatMessage, {
				props: {
					message: assistantMessage
				}
			});

			// parseAIResponse should be called with assistant message content
			expect(parseAIResponse).toHaveBeenCalledWith(assistantMessage.content, expect.any(Object));
		});

		it('should render EntityDetectionIndicator when entities are found', () => {
			const assistantMessage: Message = {
				id: 'msg-2',
				role: 'assistant',
				content: '## Captain Aldric\n\n**Role**: Guard Captain',
				timestamp: new Date(),
				conversationId: 'conv-1'
			};

			const mockParsedEntity: ParsedEntity = {
				entityType: 'npc',
				confidence: 0.85,
				name: 'Captain Aldric',
				description: 'Guard captain',
				tags: [],
				fields: { role: 'Guard Captain' },
				validationErrors: {}
			};

			vi.mocked(parseAIResponse).mockReturnValue({
				entities: [mockParsedEntity],
				hasMultiple: false,
				rawText: assistantMessage.content,
				errors: []
			});

			render(ChatMessage, {
				props: {
					message: assistantMessage
				}
			});

			// EntityDetectionIndicator should be rendered
			// Look for entity detection badge or indicator
			expect(screen.getByText(/1.*entity detected/i)).toBeInTheDocument();
		});

		it('should NOT render EntityDetectionIndicator when no entities found', () => {
			const assistantMessage: Message = {
				id: 'msg-2',
				role: 'assistant',
				content: 'Sure, I can help you with that. What would you like to know?',
				timestamp: new Date(),
				conversationId: 'conv-1'
			};

			vi.mocked(parseAIResponse).mockReturnValue({
				entities: [],
				hasMultiple: false,
				rawText: assistantMessage.content,
				errors: []
			});

			render(ChatMessage, {
				props: {
					message: assistantMessage
				}
			});

			// EntityDetectionIndicator should NOT be rendered
			expect(screen.queryByText(/entity detected/i)).not.toBeInTheDocument();
		});

		it('should display assistant message content above entity indicator', () => {
			const assistantMessage: Message = {
				id: 'msg-2',
				role: 'assistant',
				content: '## Captain Aldric\n\n**Role**: Guard Captain',
				timestamp: new Date(),
				conversationId: 'conv-1'
			};

			const mockParsedEntity: ParsedEntity = {
				entityType: 'npc',
				confidence: 0.85,
				name: 'Captain Aldric',
				description: 'Guard captain',
				tags: [],
				fields: { role: 'Guard Captain' },
				validationErrors: {}
			};

			vi.mocked(parseAIResponse).mockReturnValue({
				entities: [mockParsedEntity],
				hasMultiple: false,
				rawText: assistantMessage.content,
				errors: []
			});

			render(ChatMessage, {
				props: {
					message: assistantMessage
				}
			});

			// Message content should be visible (may appear in both message and indicator)
			expect(screen.getAllByText(/Captain Aldric/).length).toBeGreaterThan(0);
			// Entity indicator should also be visible
			expect(screen.getByText(/entity detected/i)).toBeInTheDocument();
		});
	});

	describe('Multiple Entity Detection', () => {
		it('should render indicator for multiple entities', () => {
			const assistantMessage: Message = {
				id: 'msg-3',
				role: 'assistant',
				content: '## Captain Aldric\n\n**Role**: Guard\n\n---\n\n## The Rusty Anchor\n\n**Type**: Tavern',
				timestamp: new Date(),
				conversationId: 'conv-1'
			};

			const mockParsedEntities: ParsedEntity[] = [
				{
					entityType: 'npc',
					confidence: 0.85,
					name: 'Captain Aldric',
					description: 'Guard captain',
					tags: [],
					fields: { role: 'Guard' },
					validationErrors: {}
				},
				{
					entityType: 'location',
					confidence: 0.9,
					name: 'The Rusty Anchor',
					description: 'Tavern',
					tags: [],
					fields: { locationType: 'Tavern' },
					validationErrors: {}
				}
			];

			vi.mocked(parseAIResponse).mockReturnValue({
				entities: mockParsedEntities,
				hasMultiple: true,
				rawText: assistantMessage.content,
				errors: []
			});

			render(ChatMessage, {
				props: {
					message: assistantMessage
				}
			});

			// Should show multiple entities detected
			expect(screen.getByText(/2.*entities detected/i)).toBeInTheDocument();
		});

		it('should pass all entities to EntityDetectionIndicator', () => {
			const assistantMessage: Message = {
				id: 'msg-3',
				role: 'assistant',
				content: '## Entity 1\n\n---\n\n## Entity 2\n\n---\n\n## Entity 3',
				timestamp: new Date(),
				conversationId: 'conv-1'
			};

			const mockParsedEntities: ParsedEntity[] = [
				{
					entityType: 'npc',
					confidence: 0.8,
					name: 'Entity 1',
					description: 'First',
					tags: [],
					fields: {},
					validationErrors: {}
				},
				{
					entityType: 'npc',
					confidence: 0.8,
					name: 'Entity 2',
					description: 'Second',
					tags: [],
					fields: {},
					validationErrors: {}
				},
				{
					entityType: 'npc',
					confidence: 0.8,
					name: 'Entity 3',
					description: 'Third',
					tags: [],
					fields: {},
					validationErrors: {}
				}
			];

			vi.mocked(parseAIResponse).mockReturnValue({
				entities: mockParsedEntities,
				hasMultiple: true,
				rawText: assistantMessage.content,
				errors: []
			});

			render(ChatMessage, {
				props: {
					message: assistantMessage
				}
			});

			expect(screen.getByText(/3.*entities detected/i)).toBeInTheDocument();
		});
	});

	describe('Entity Parsing Options', () => {
		it('should use minConfidence threshold when parsing', () => {
			const assistantMessage: Message = {
				id: 'msg-2',
				role: 'assistant',
				content: '## Maybe an NPC',
				timestamp: new Date(),
				conversationId: 'conv-1'
			};

			vi.mocked(parseAIResponse).mockReturnValue({
				entities: [],
				hasMultiple: false,
				rawText: assistantMessage.content,
				errors: []
			});

			render(ChatMessage, {
				props: {
					message: assistantMessage
				}
			});

			// Should pass options to parseAIResponse
			expect(parseAIResponse).toHaveBeenCalledWith(
				assistantMessage.content,
				expect.objectContaining({
					minConfidence: expect.any(Number)
				})
			);
		});

		it('should pass custom entity types if available', () => {
			const assistantMessage: Message = {
				id: 'msg-2',
				role: 'assistant',
				content: '## Fireball\n\n**Level**: 3',
				timestamp: new Date(),
				conversationId: 'conv-1'
			};

			vi.mocked(parseAIResponse).mockReturnValue({
				entities: [],
				hasMultiple: false,
				rawText: assistantMessage.content,
				errors: []
			});

			render(ChatMessage, {
				props: {
					message: assistantMessage
				}
			});

			// Should include custom types in parsing options
			expect(parseAIResponse).toHaveBeenCalled();
		});
	});

	describe('Entity Save Integration', () => {
		it('should handle entity save callback from indicator', () => {
			const assistantMessage: Message = {
				id: 'msg-2',
				role: 'assistant',
				content: '## Captain Aldric\n\n**Role**: Guard Captain',
				timestamp: new Date(),
				conversationId: 'conv-1'
			};

			const mockParsedEntity: ParsedEntity = {
				entityType: 'npc',
				confidence: 0.85,
				name: 'Captain Aldric',
				description: 'Guard captain',
				tags: [],
				fields: { role: 'Guard Captain' },
				validationErrors: {}
			};

			vi.mocked(parseAIResponse).mockReturnValue({
				entities: [mockParsedEntity],
				hasMultiple: false,
				rawText: assistantMessage.content,
				errors: []
			});

			render(ChatMessage, {
				props: {
					message: assistantMessage
				}
			});

			// Component should be ready to handle entity saves
			// (EntityDetectionIndicator will handle the actual save UI)
		});

		it('should track which entities have been saved', () => {
			const assistantMessage: Message = {
				id: 'msg-2',
				role: 'assistant',
				content: '## Captain Aldric\n\n**Role**: Guard Captain',
				timestamp: new Date(),
				conversationId: 'conv-1'
			};

			const mockParsedEntity: ParsedEntity = {
				entityType: 'npc',
				confidence: 0.85,
				name: 'Captain Aldric',
				description: 'Guard captain',
				tags: [],
				fields: { role: 'Guard Captain' },
				validationErrors: {}
			};

			vi.mocked(parseAIResponse).mockReturnValue({
				entities: [mockParsedEntity],
				hasMultiple: false,
				rawText: assistantMessage.content,
				errors: []
			});

			render(ChatMessage, {
				props: {
					message: assistantMessage
				}
			});

			// Component should maintain state of saved entities
		});
	});

	describe('Edge Cases and Error Handling', () => {
		it('should handle parsing errors gracefully', () => {
			const assistantMessage: Message = {
				id: 'msg-2',
				role: 'assistant',
				content: 'Some content',
				timestamp: new Date(),
				conversationId: 'conv-1'
			};

			vi.mocked(parseAIResponse).mockImplementation(() => {
				throw new Error('Parsing error');
			});

			// Should not crash
			expect(() => {
				render(ChatMessage, {
					props: {
						message: assistantMessage
					}
				});
			}).not.toThrow();
		});

		it('should handle empty assistant message', () => {
			const assistantMessage: Message = {
				id: 'msg-2',
				role: 'assistant',
				content: '',
				timestamp: new Date(),
				conversationId: 'conv-1'
			};

			vi.mocked(parseAIResponse).mockReturnValue({
				entities: [],
				hasMultiple: false,
				rawText: '',
				errors: []
			});

			render(ChatMessage, {
				props: {
					message: assistantMessage
				}
			});

			// Should not crash
			expect(screen.queryByText(/entity detected/i)).not.toBeInTheDocument();
		});

		it('should handle very long assistant messages', () => {
			const assistantMessage: Message = {
				id: 'msg-2',
				role: 'assistant',
				content: '## NPC\n\n' + 'A'.repeat(10000),
				timestamp: new Date(),
				conversationId: 'conv-1'
			};

			const mockParsedEntity: ParsedEntity = {
				entityType: 'npc',
				confidence: 0.8,
				name: 'NPC',
				description: 'A'.repeat(10000),
				tags: [],
				fields: {},
				validationErrors: {}
			};

			vi.mocked(parseAIResponse).mockReturnValue({
				entities: [mockParsedEntity],
				hasMultiple: false,
				rawText: assistantMessage.content,
				errors: []
			});

			// Should handle without performance issues
			expect(() => {
				render(ChatMessage, {
					props: {
						message: assistantMessage
					}
				});
			}).not.toThrow();
		});

		it('should only parse once per message render', () => {
			const assistantMessage: Message = {
				id: 'msg-2',
				role: 'assistant',
				content: '## Captain Aldric',
				timestamp: new Date(),
				conversationId: 'conv-1'
			};

			vi.mocked(parseAIResponse).mockReturnValue({
				entities: [],
				hasMultiple: false,
				rawText: assistantMessage.content,
				errors: []
			});

			render(ChatMessage, {
				props: {
					message: assistantMessage
				}
			});

			// Should only call parseAIResponse once
			expect(parseAIResponse).toHaveBeenCalledTimes(1);
		});

		// Note: System messages are not supported by the ChatMessage type
		// The role is restricted to 'user' | 'assistant' only
	});
});
