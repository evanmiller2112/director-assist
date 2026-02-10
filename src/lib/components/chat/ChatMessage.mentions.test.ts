/**
 * Tests for ChatMessage Component - Mention Rendering (TDD RED Phase)
 *
 * GitHub Issue #202: Render Mentions in Chat Display
 *
 * This test file covers the visual highlighting and entity linking of @mentions in chat messages.
 * Features tested:
 * - Visual highlighting of mentions with distinct styles
 * - Recognition of single-word and multi-word mentions
 * - Protection against highlighting email addresses
 * - Entity linking with context entities
 * - Interactive behavior (hover states, click events)
 *
 * These tests should FAIL initially as mention rendering doesn't exist yet.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import ChatMessage from './ChatMessage.svelte';
import type { ChatMessage as Message } from '$lib/types';

// Mock the entity parser service to avoid side effects
vi.mock('$lib/services/entityParserService', () => ({
	parseAIResponse: vi.fn(() => ({
		entities: [],
		hasMultiple: false,
		rawText: '',
		errors: []
	}))
}));

describe('ChatMessage Component - Mention Rendering', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('Visual Highlighting - Basic Mention Detection', () => {
		it('should render a single @mention with distinct visual style', () => {
			const userMessage: Message = {
				id: 'msg-1',
				role: 'user',
				content: 'Tell me about @Gandalf',
				timestamp: new Date(),
				conversationId: 'conv-1'
			};

			render(ChatMessage, {
				props: {
					message: userMessage
				}
			});

			// Mention should be wrapped in a span with data-testid
			const mention = screen.getByTestId('mention-Gandalf');
			expect(mention).toBeInTheDocument();
			expect(mention).toHaveTextContent('@Gandalf');
		});

		it('should render mention text differently from regular text', () => {
			const userMessage: Message = {
				id: 'msg-1',
				role: 'user',
				content: 'Tell me about @Gandalf the wizard',
				timestamp: new Date(),
				conversationId: 'conv-1'
			};

			const { container } = render(ChatMessage, {
				props: {
					message: userMessage
				}
			});

			// Mention should have a specific class for styling
			const mention = screen.getByTestId('mention-Gandalf');
			expect(mention).toHaveClass('mention'); // or similar styling class
		});

		it('should render non-mentioned text normally', () => {
			const userMessage: Message = {
				id: 'msg-1',
				role: 'user',
				content: 'Tell me about @Gandalf please',
				timestamp: new Date(),
				conversationId: 'conv-1'
			};

			render(ChatMessage, {
				props: {
					message: userMessage
				}
			});

			// Regular text should be present
			expect(screen.getByText(/Tell me about/)).toBeInTheDocument();
			expect(screen.getByText(/please/)).toBeInTheDocument();

			// Mention should be highlighted
			expect(screen.getByTestId('mention-Gandalf')).toBeInTheDocument();
		});

		it('should highlight multiple mentions in one message', () => {
			const userMessage: Message = {
				id: 'msg-1',
				role: 'user',
				content: '@Gandalf went to @The Shire with @Frodo',
				timestamp: new Date(),
				conversationId: 'conv-1'
			};

			render(ChatMessage, {
				props: {
					message: userMessage
				}
			});

			// All three mentions should be highlighted
			expect(screen.getByTestId('mention-Gandalf')).toBeInTheDocument();
			expect(screen.getByTestId('mention-The Shire')).toBeInTheDocument();
			expect(screen.getByTestId('mention-Frodo')).toBeInTheDocument();
		});
	});

	describe('Mention Recognition - Single and Multi-Word', () => {
		it('should recognize @SingleName mentions', () => {
			const userMessage: Message = {
				id: 'msg-1',
				role: 'user',
				content: 'Where is @Gandalf?',
				timestamp: new Date(),
				conversationId: 'conv-1'
			};

			render(ChatMessage, {
				props: {
					message: userMessage
				}
			});

			const mention = screen.getByTestId('mention-Gandalf');
			expect(mention).toBeInTheDocument();
			expect(mention).toHaveTextContent('@Gandalf');
		});

		it('should recognize @Multi Word mentions', () => {
			const userMessage: Message = {
				id: 'msg-1',
				role: 'user',
				content: 'I visited @The Shire yesterday',
				timestamp: new Date(),
				conversationId: 'conv-1'
			};

			render(ChatMessage, {
				props: {
					message: userMessage
				}
			});

			const mention = screen.getByTestId('mention-The Shire');
			expect(mention).toBeInTheDocument();
			expect(mention).toHaveTextContent('@The Shire');
		});

		it('should recognize mentions with name particles', () => {
			const userMessage: Message = {
				id: 'msg-1',
				role: 'user',
				content: 'Talk to @Leonardo da Vinci about it',
				timestamp: new Date(),
				conversationId: 'conv-1'
			};

			render(ChatMessage, {
				props: {
					message: userMessage
				}
			});

			const mention = screen.getByTestId('mention-Leonardo da Vinci');
			expect(mention).toBeInTheDocument();
		});

		it('should handle mentions at start of message', () => {
			const userMessage: Message = {
				id: 'msg-1',
				role: 'user',
				content: '@Gandalf is a wizard',
				timestamp: new Date(),
				conversationId: 'conv-1'
			};

			render(ChatMessage, {
				props: {
					message: userMessage
				}
			});

			expect(screen.getByTestId('mention-Gandalf')).toBeInTheDocument();
		});

		it('should handle mentions in middle of message', () => {
			const userMessage: Message = {
				id: 'msg-1',
				role: 'user',
				content: 'I met @Gandalf yesterday',
				timestamp: new Date(),
				conversationId: 'conv-1'
			};

			render(ChatMessage, {
				props: {
					message: userMessage
				}
			});

			expect(screen.getByTestId('mention-Gandalf')).toBeInTheDocument();
		});

		it('should handle mentions at end of message', () => {
			const userMessage: Message = {
				id: 'msg-1',
				role: 'user',
				content: 'Have you seen @Gandalf',
				timestamp: new Date(),
				conversationId: 'conv-1'
			};

			render(ChatMessage, {
				props: {
					message: userMessage
				}
			});

			expect(screen.getByTestId('mention-Gandalf')).toBeInTheDocument();
		});
	});

	describe('Email Address Protection', () => {
		it('should NOT highlight @ in email addresses', () => {
			const userMessage: Message = {
				id: 'msg-1',
				role: 'user',
				content: 'Contact me at user@example.com for details',
				timestamp: new Date(),
				conversationId: 'conv-1'
			};

			render(ChatMessage, {
				props: {
					message: userMessage
				}
			});

			// Should not create a mention for email
			expect(screen.queryByTestId(/^mention-/)).not.toBeInTheDocument();

			// Email should appear as plain text
			expect(screen.getByText(/user@example.com/)).toBeInTheDocument();
		});

		it('should distinguish between mentions and emails in same message', () => {
			const userMessage: Message = {
				id: 'msg-1',
				role: 'user',
				content: '@Gandalf please email me at wizard@example.com',
				timestamp: new Date(),
				conversationId: 'conv-1'
			};

			render(ChatMessage, {
				props: {
					message: userMessage
				}
			});

			// Should have mention for Gandalf
			expect(screen.getByTestId('mention-Gandalf')).toBeInTheDocument();

			// Should NOT have mention for email
			expect(screen.queryByTestId('mention-wizard')).not.toBeInTheDocument();
			expect(screen.queryByTestId('mention-example.com')).not.toBeInTheDocument();
		});
	});

	describe('Entity Linking with Context Entities', () => {
		it('should show entity type indicator for mentions with matching context entities', () => {
			const userMessage: Message = {
				id: 'msg-1',
				role: 'user',
				content: 'Tell me about @Gandalf',
				timestamp: new Date(),
				conversationId: 'conv-1',
				contextEntities: ['entity-gandalf-123']
			};

			// Mock entity data would be provided via context
			// For now, just test that the mention has entity-linked class
			const { container } = render(ChatMessage, {
				props: {
					message: userMessage
				}
			});

			const mention = screen.getByTestId('mention-Gandalf');
			expect(mention).toHaveAttribute('data-entity-id', 'entity-gandalf-123');
			expect(mention).toHaveClass('mention-linked'); // Indicates it's linked to an entity
		});

		it('should render unlinked mentions without entity indicators', () => {
			const userMessage: Message = {
				id: 'msg-1',
				role: 'user',
				content: 'Tell me about @SomeUnknownEntity',
				timestamp: new Date(),
				conversationId: 'conv-1',
				contextEntities: [] // No context entities
			};

			render(ChatMessage, {
				props: {
					message: userMessage
				}
			});

			const mention = screen.getByTestId('mention-SomeUnknownEntity');
			expect(mention).not.toHaveAttribute('data-entity-id');
			expect(mention).not.toHaveClass('mention-linked');
		});

		it('should match mentions case-insensitively to context entities', () => {
			const userMessage: Message = {
				id: 'msg-1',
				role: 'user',
				content: 'Where is @gandalf?', // lowercase mention
				timestamp: new Date(),
				conversationId: 'conv-1',
				contextEntities: ['entity-gandalf-123'] // Entity named "Gandalf"
			};

			render(ChatMessage, {
				props: {
					message: userMessage
				}
			});

			// Should still match despite case difference
			const mention = screen.getByTestId('mention-gandalf');
			expect(mention).toHaveAttribute('data-entity-id', 'entity-gandalf-123');
		});
	});

	describe('Interactive Behavior', () => {
		it('should show cursor pointer on hover for linked mentions', () => {
			const userMessage: Message = {
				id: 'msg-1',
				role: 'user',
				content: 'Tell me about @Gandalf',
				timestamp: new Date(),
				conversationId: 'conv-1',
				contextEntities: ['entity-gandalf-123']
			};

			const { container } = render(ChatMessage, {
				props: {
					message: userMessage
				}
			});

			const mention = screen.getByTestId('mention-Gandalf');
			// Linked mentions should have cursor pointer
			expect(mention).toHaveClass('cursor-pointer');
		});

		it('should not show cursor pointer for unlinked mentions', () => {
			const userMessage: Message = {
				id: 'msg-1',
				role: 'user',
				content: 'Tell me about @UnknownEntity',
				timestamp: new Date(),
				conversationId: 'conv-1',
				contextEntities: []
			};

			render(ChatMessage, {
				props: {
					message: userMessage
				}
			});

			const mention = screen.getByTestId('mention-UnknownEntity');
			// Unlinked mentions should not be clickable
			expect(mention).not.toHaveClass('cursor-pointer');
		});
	});

	describe('Assistant Messages with Mentions', () => {
		it('should highlight mentions in assistant messages', () => {
			const assistantMessage: Message = {
				id: 'msg-2',
				role: 'assistant',
				content: '@Gandalf is a powerful wizard who resides in @The Shire',
				timestamp: new Date(),
				conversationId: 'conv-1'
			};

			render(ChatMessage, {
				props: {
					message: assistantMessage
				}
			});

			expect(screen.getByTestId('mention-Gandalf')).toBeInTheDocument();
			expect(screen.getByTestId('mention-The Shire')).toBeInTheDocument();
		});

		it('should work alongside entity detection indicator', () => {
			const assistantMessage: Message = {
				id: 'msg-2',
				role: 'assistant',
				content: '@Gandalf is a wizard. ## New NPC\n\n**Name**: Saruman',
				timestamp: new Date(),
				conversationId: 'conv-1'
			};

			render(ChatMessage, {
				props: {
					message: assistantMessage
				}
			});

			// Both mention highlighting and entity detection should work
			expect(screen.getByTestId('mention-Gandalf')).toBeInTheDocument();
			// Entity detection indicator tests are in ChatMessage.test.ts
		});
	});

	describe('Edge Cases', () => {
		it('should render message with no mentions normally', () => {
			const userMessage: Message = {
				id: 'msg-1',
				role: 'user',
				content: 'This is a regular message without any mentions',
				timestamp: new Date(),
				conversationId: 'conv-1'
			};

			render(ChatMessage, {
				props: {
					message: userMessage
				}
			});

			// No mention elements should be present
			expect(screen.queryByTestId(/^mention-/)).not.toBeInTheDocument();

			// Message content should still be visible
			expect(screen.getByText(/This is a regular message/)).toBeInTheDocument();
		});

		it('should handle empty message without errors', () => {
			const userMessage: Message = {
				id: 'msg-1',
				role: 'user',
				content: '',
				timestamp: new Date(),
				conversationId: 'conv-1'
			};

			// Should not throw
			expect(() => {
				render(ChatMessage, {
					props: {
						message: userMessage
					}
				});
			}).not.toThrow();

			expect(screen.queryByTestId(/^mention-/)).not.toBeInTheDocument();
		});

		it('should handle @ with no valid mention', () => {
			const userMessage: Message = {
				id: 'msg-1',
				role: 'user',
				content: 'I use @ symbol randomly @ times',
				timestamp: new Date(),
				conversationId: 'conv-1'
			};

			render(ChatMessage, {
				props: {
					message: userMessage
				}
			});

			// Should not crash, may or may not create mentions depending on parsing logic
			expect(screen.getByText(/I use @ symbol randomly @ times/)).toBeInTheDocument();
		});

		it('should handle @ at end of message with no name', () => {
			const userMessage: Message = {
				id: 'msg-1',
				role: 'user',
				content: 'Send this to @',
				timestamp: new Date(),
				conversationId: 'conv-1'
			};

			render(ChatMessage, {
				props: {
					message: userMessage
				}
			});

			// Should not create mention for lonely "@"
			expect(screen.queryByTestId(/^mention-$/)).not.toBeInTheDocument();
		});

		it('should handle consecutive mentions without spaces', () => {
			const userMessage: Message = {
				id: 'msg-1',
				role: 'user',
				content: '@Gandalf@Frodo@Sam',
				timestamp: new Date(),
				conversationId: 'conv-1'
			};

			render(ChatMessage, {
				props: {
					message: userMessage
				}
			});

			// Should detect all three mentions
			expect(screen.getByTestId('mention-Gandalf')).toBeInTheDocument();
			expect(screen.getByTestId('mention-Frodo')).toBeInTheDocument();
			expect(screen.getByTestId('mention-Sam')).toBeInTheDocument();
		});

		it('should preserve whitespace and line breaks in non-mention text', () => {
			const userMessage: Message = {
				id: 'msg-1',
				role: 'user',
				content: '@Gandalf\n\nWent to\n@The Shire',
				timestamp: new Date(),
				conversationId: 'conv-1'
			};

			const { container } = render(ChatMessage, {
				props: {
					message: userMessage
				}
			});

			// Message should preserve whitespace-pre-wrap formatting
			const messageContent = container.querySelector('.whitespace-pre-wrap');
			expect(messageContent).toBeInTheDocument();

			// Mentions should still be highlighted
			expect(screen.getByTestId('mention-Gandalf')).toBeInTheDocument();
			expect(screen.getByTestId('mention-The Shire')).toBeInTheDocument();
		});

		it('should handle very long mention names', () => {
			const longName = 'A'.repeat(100);
			const userMessage: Message = {
				id: 'msg-1',
				role: 'user',
				content: `Tell me about @${longName}`,
				timestamp: new Date(),
				conversationId: 'conv-1'
			};

			render(ChatMessage, {
				props: {
					message: userMessage
				}
			});

			expect(screen.getByTestId(`mention-${longName}`)).toBeInTheDocument();
		});

		it('should handle special characters in surrounding text', () => {
			const userMessage: Message = {
				id: 'msg-1',
				role: 'user',
				content: 'Hey! @Gandalf, how are you? @The Shire is nice.',
				timestamp: new Date(),
				conversationId: 'conv-1'
			};

			render(ChatMessage, {
				props: {
					message: userMessage
				}
			});

			expect(screen.getByTestId('mention-Gandalf')).toBeInTheDocument();
			expect(screen.getByTestId('mention-The Shire')).toBeInTheDocument();
			expect(screen.getByText(/Hey!/)).toBeInTheDocument();
		});
	});

	describe('Performance and Rendering', () => {
		it('should handle messages with many mentions efficiently', () => {
			const mentions = Array.from({ length: 50 }, (_, i) => `@Entity${i}`).join(' ');
			const userMessage: Message = {
				id: 'msg-1',
				role: 'user',
				content: mentions,
				timestamp: new Date(),
				conversationId: 'conv-1'
			};

			// Should render without performance issues
			const startTime = performance.now();
			render(ChatMessage, {
				props: {
					message: userMessage
				}
			});
			const endTime = performance.now();

			// Should be reasonably fast (under 100ms for 50 mentions)
			expect(endTime - startTime).toBeLessThan(100);

			// Verify all mentions are rendered
			for (let i = 0; i < 50; i++) {
				expect(screen.getByTestId(`mention-Entity${i}`)).toBeInTheDocument();
			}
		});

		it('should not re-parse mentions unnecessarily', () => {
			const userMessage: Message = {
				id: 'msg-1',
				role: 'user',
				content: 'Tell me about @Gandalf',
				timestamp: new Date(),
				conversationId: 'conv-1'
			};

			const { rerender } = render(ChatMessage, {
				props: {
					message: userMessage
				}
			});

			expect(screen.getByTestId('mention-Gandalf')).toBeInTheDocument();

			// Re-render with same message
			rerender({
				message: userMessage
			});

			// Should still show mention correctly
			expect(screen.getByTestId('mention-Gandalf')).toBeInTheDocument();
		});
	});
});
