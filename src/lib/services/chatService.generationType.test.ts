/**
 * Tests for Chat Service - Generation Type Integration (TDD RED Phase)
 *
 * Issue #41: Generation Type Selector in Chat
 *
 * This test suite covers the integration of generation types into the chatService.
 * It tests how the service modifies the system prompt based on the selected generation type.
 *
 * Coverage:
 * - sendChatMessage accepting generationType parameter
 * - Type-specific prompt template appending
 * - Suggested structure inclusion
 * - Prompt combination with context
 * - All generation types
 * - Edge cases and validation
 *
 * These tests are expected to FAIL initially (RED phase).
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { sendChatMessage } from './chatService';
import type { GenerationType } from '$lib/types';

// Use vi.hoisted to define mocks that can be used in vi.mock factories
const { mockMessagesCreate, mockMessagesStream, mockBuildContext, mockFormatContextForPrompt } = vi.hoisted(() => ({
	mockMessagesCreate: vi.fn(),
	mockMessagesStream: vi.fn(),
	mockBuildContext: vi.fn(),
	mockFormatContextForPrompt: vi.fn()
}));

// Mock Anthropic SDK using constructor function pattern (like entityGenerationService.test.ts)
vi.mock('@anthropic-ai/sdk', () => {
	const MockAnthropic = function(this: any, config: any) {
		this.messages = {
			create: mockMessagesCreate,
			stream: mockMessagesStream
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

// Mock context builder
vi.mock('./contextBuilder', () => ({
	buildContext: mockBuildContext,
	formatContextForPrompt: mockFormatContextForPrompt
}));

// Mock model service
vi.mock('./modelService', () => ({
	getSelectedModel: vi.fn().mockReturnValue('claude-haiku-4-5-20250514')
}));

describe('chatService - Generation Type Integration', () => {
	beforeEach(async () => {
		vi.clearAllMocks();

		// Mock localStorage
		const mockLocalStorage = {
			getItem: vi.fn((key: string) => {
				if (key === 'dm-assist-api-key') return 'test-api-key';
				if (key === 'dm-assist-selected-model') return 'claude-haiku-4-5-20250514';
				return null;
			}),
			setItem: vi.fn(),
			removeItem: vi.fn(),
			clear: vi.fn(),
			length: 0,
			key: vi.fn()
		};

		Object.defineProperty(global, 'localStorage', {
			value: mockLocalStorage,
			writable: true
		});

		// Setup mock Anthropic responses
		mockMessagesCreate.mockResolvedValue({
			content: [{ type: 'text', text: 'AI response' }]
		});

		mockMessagesStream.mockReturnValue({
			[Symbol.asyncIterator]: async function* () {
				yield {
					type: 'content_block_delta',
					delta: { type: 'text_delta', text: 'AI response' }
				};
			}
		});

		// Setup context builder mocks with defaults
		mockBuildContext.mockResolvedValue([]);
		mockFormatContextForPrompt.mockReturnValue('');

		// Mock database services
		vi.doMock('$lib/db/repositories', () => ({
			chatRepository: {
				getRecent: vi.fn(() => ({
					subscribe: vi.fn((observer: any) => {
						observer.next([]);
						return { unsubscribe: vi.fn() };
					})
				}))
			}
		}));
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe('sendChatMessage with generationType parameter', () => {
		it('should accept generationType as 5th parameter', async () => {
			await expect(
				sendChatMessage('Test message', [], true, undefined, 'custom')
			).resolves.not.toThrow();
		});

		it('should work with all generation types', async () => {
			const types: GenerationType[] = [
				'custom',
				'npc',
				'location',
				'plot_hook',
				'combat',
				'item',
				'faction',
				'session_prep'
			];

			for (const type of types) {
				await expect(
					sendChatMessage('Test', [], true, undefined, type)
				).resolves.not.toThrow();
			}
		});

		it('should default to "custom" if generationType not provided', async () => {
			// Call without generationType parameter
			await sendChatMessage('Test message', [], true);

			expect(mockMessagesCreate).toHaveBeenCalled();
			const callArgs = mockMessagesCreate.mock.calls[0][0];
			expect(callArgs.system).toBeDefined();
			// System prompt should not have specialized type prompt
		});

		it('should use generationType in API call', async () => {
			await sendChatMessage('Generate NPC', [], true, undefined, 'npc');

			expect(mockMessagesCreate).toHaveBeenCalled();
		});
	});

	describe('Custom (General) generation type', () => {
		it('should use default system prompt for custom type', async () => {
			await sendChatMessage('Test', [], true, undefined, 'custom');

			expect(mockMessagesCreate).toHaveBeenCalled();
			const callArgs = mockMessagesCreate.mock.calls[0][0];

			// Should have base system prompt
			expect(callArgs.system).toContain('TTRPG campaign assistant');
			// Should not have additional specialized prompting
			expect(callArgs.system).not.toContain('Generate an NPC');
			expect(callArgs.system).not.toContain('Generate a location');
		});

		it('should not add suggested structure for custom type', async () => {
			await sendChatMessage('Test', [], true, undefined, 'custom');

			expect(mockMessagesCreate).toHaveBeenCalled();
			const callArgs = mockMessagesCreate.mock.calls[0][0];

			// Should not have structure guidance
			expect(callArgs.system).not.toContain('## Name');
			expect(callArgs.system).not.toContain('## Description');
		});
	});

	describe('NPC generation type', () => {
		it('should append NPC prompt template to system prompt', async () => {
			await sendChatMessage('Generate an NPC', [], true, undefined, 'npc');

			expect(mockMessagesCreate).toHaveBeenCalled();
			const callArgs = mockMessagesCreate.mock.calls[0][0];

			// Should have base prompt + NPC-specific prompt
			expect(callArgs.system).toContain('TTRPG campaign assistant');
			expect(callArgs.system).toContain('NPC');
		});

		it('should include NPC suggested structure in prompt', async () => {
			await sendChatMessage('Generate an NPC', [], true, undefined, 'npc');

			expect(mockMessagesCreate).toHaveBeenCalled();
			const callArgs = mockMessagesCreate.mock.calls[0][0];

			// Should include structure guidance
			expect(callArgs.system.toLowerCase()).toMatch(/name|personality|motivation/);
		});

		it('should guide AI to generate NPC fields', async () => {
			await sendChatMessage('Create a merchant', [], true, undefined, 'npc');

			const callArgs = mockMessagesCreate.mock.calls[0][0];
			expect(callArgs.system.toLowerCase()).toContain('npc');
		});
	});

	describe('Location generation type', () => {
		it('should append location prompt template', async () => {
			await sendChatMessage('Generate a tavern', [], true, undefined, 'location');

			expect(mockMessagesCreate).toHaveBeenCalled();
			const callArgs = mockMessagesCreate.mock.calls[0][0];

			expect(callArgs.system).toContain('location');
		});

		it('should include location suggested structure', async () => {
			await sendChatMessage('Generate a location', [], true, undefined, 'location');

			const callArgs = mockMessagesCreate.mock.calls[0][0];
			expect(callArgs.system.toLowerCase()).toMatch(/atmosphere|inhabitants|points of interest/);
		});
	});

	describe('Plot Hook generation type', () => {
		it('should append plot hook prompt template', async () => {
			await sendChatMessage('Generate a plot hook', [], true, undefined, 'plot_hook');

			expect(mockMessagesCreate).toHaveBeenCalled();
			const callArgs = mockMessagesCreate.mock.calls[0][0];

			expect(callArgs.system.toLowerCase()).toMatch(/plot|hook|story/);
		});

		it('should include plot hook suggested structure', async () => {
			await sendChatMessage('Create a story', [], true, undefined, 'plot_hook');

			const callArgs = mockMessagesCreate.mock.calls[0][0];
			expect(callArgs.system.toLowerCase()).toMatch(/premise|complication|stakes/);
		});
	});

	describe('Encounter generation type', () => {
		it('should append encounter prompt template', async () => {
			await sendChatMessage('Generate an encounter', [], true, undefined, 'combat');

			expect(mockMessagesCreate).toHaveBeenCalled();
			const callArgs = mockMessagesCreate.mock.calls[0][0];

			expect(callArgs.system).toContain('combat');
		});

		it('should include encounter suggested structure', async () => {
			await sendChatMessage('Create a battle', [], true, undefined, 'combat');

			const callArgs = mockMessagesCreate.mock.calls[0][0];
			expect(callArgs.system.toLowerCase()).toMatch(/enemies|terrain|tactics/);
		});
	});

	describe('Item generation type', () => {
		it('should append item prompt template', async () => {
			await sendChatMessage('Generate an item', [], true, undefined, 'item');

			expect(mockMessagesCreate).toHaveBeenCalled();
			const callArgs = mockMessagesCreate.mock.calls[0][0];

			expect(callArgs.system).toContain('item');
		});

		it('should include item suggested structure', async () => {
			await sendChatMessage('Create a sword', [], true, undefined, 'item');

			const callArgs = mockMessagesCreate.mock.calls[0][0];
			expect(callArgs.system.toLowerCase()).toMatch(/properties|abilities|appearance/);
		});
	});

	describe('Faction generation type', () => {
		it('should append faction prompt template', async () => {
			await sendChatMessage('Generate a faction', [], true, undefined, 'faction');

			expect(mockMessagesCreate).toHaveBeenCalled();
			const callArgs = mockMessagesCreate.mock.calls[0][0];

			expect(callArgs.system).toContain('faction');
		});

		it('should include faction suggested structure', async () => {
			await sendChatMessage('Create a guild', [], true, undefined, 'faction');

			const callArgs = mockMessagesCreate.mock.calls[0][0];
			expect(callArgs.system.toLowerCase()).toMatch(/goals|resources|leadership/);
		});
	});

	describe('Session Prep generation type', () => {
		it('should append session prep prompt template', async () => {
			await sendChatMessage('Help me prep session', [], true, undefined, 'session_prep');

			expect(mockMessagesCreate).toHaveBeenCalled();
			const callArgs = mockMessagesCreate.mock.calls[0][0];

			expect(callArgs.system.toLowerCase()).toMatch(/session|prep/);
		});

		it('should include session prep suggested structure', async () => {
			await sendChatMessage('Plan my session', [], true, undefined, 'session_prep');

			const callArgs = mockMessagesCreate.mock.calls[0][0];
			expect(callArgs.system.toLowerCase()).toMatch(/scenes|npcs|pacing/);
		});
	});

	describe('Prompt combination with context', () => {
		it('should combine generationType prompt with context prompt', async () => {
			// Mock context builder to return some context
			mockBuildContext.mockResolvedValue([
				{ id: 'entity-1', name: 'Test Entity', type: 'npc' }
			]);
			mockFormatContextForPrompt.mockReturnValue(
				'# Campaign Context\n\n## Entity: Test Entity'
			);

			await sendChatMessage('Generate NPC', ['entity-1'], true, undefined, 'npc');

			expect(mockMessagesCreate).toHaveBeenCalled();
			const callArgs = mockMessagesCreate.mock.calls[0][0];

			// Should have base prompt + context + NPC type prompt
			expect(callArgs.system).toContain('TTRPG campaign assistant');
			expect(callArgs.system).toContain('Campaign Context');
			expect(callArgs.system).toContain('NPC');
		});

		it('should append type prompt after context prompt', async () => {
			mockFormatContextForPrompt.mockReturnValue('# Context Content');

			await sendChatMessage('Test', ['entity-1'], true, undefined, 'location');

			const callArgs = mockMessagesCreate.mock.calls[0][0];
			const systemPrompt = callArgs.system;

			// Context should come before type-specific prompt
			const contextIndex = systemPrompt.indexOf('Context Content');
			// Look for the location-specific prompt text (not just 'location' which appears in base prompt)
			const typeIndex = systemPrompt.toLowerCase().indexOf('vivid place with atmosphere');

			expect(contextIndex).toBeGreaterThan(-1);
			expect(typeIndex).toBeGreaterThan(contextIndex);
		});

		it('should handle empty context with generationType', async () => {
			mockBuildContext.mockResolvedValue([]);
			mockFormatContextForPrompt.mockReturnValue('');

			await sendChatMessage('Test', [], true, undefined, 'npc');

			expect(mockMessagesCreate).toHaveBeenCalled();
			const callArgs = mockMessagesCreate.mock.calls[0][0];

			// Should still have type prompt even without context
			expect(callArgs.system).toContain('TTRPG campaign assistant');
			expect(callArgs.system).toContain('NPC');
		});
	});

	describe('Streaming with generationType', () => {
		it('should support streaming with generationType', async () => {
			const onStream = vi.fn();

			await sendChatMessage('Generate NPC', [], true, onStream, 'npc');

			expect(mockMessagesStream).toHaveBeenCalled();
			expect(onStream).toHaveBeenCalled();
		});

		it('should pass generationType prompt to streaming API', async () => {
			const onStream = vi.fn();

			await sendChatMessage('Test', [], true, onStream, 'location');

			expect(mockMessagesStream).toHaveBeenCalled();
			const callArgs = mockMessagesStream.mock.calls[0][0];

			expect(callArgs.system).toContain('location');
		});

		it('should work with all generation types in streaming mode', async () => {
			const types: GenerationType[] = [
				'npc',
				'location',
				'plot_hook',
				'combat',
				'item',
				'faction',
				'session_prep'
			];

			for (const type of types) {
				mockMessagesStream.mockClear();
				const onStream = vi.fn();

				await sendChatMessage('Test', [], true, onStream, type);

				expect(mockMessagesStream).toHaveBeenCalled();
			}
		});
	});

	describe('Non-streaming with generationType', () => {
		it('should work without streaming callback and with generationType', async () => {
			await sendChatMessage('Test', [], true, undefined, 'npc');

			expect(mockMessagesCreate).toHaveBeenCalled();
			expect(mockMessagesStream).not.toHaveBeenCalled();
		});

		it('should pass generationType prompt to non-streaming API', async () => {
			await sendChatMessage('Test', [], true, undefined, 'combat');

			expect(mockMessagesCreate).toHaveBeenCalled();
			const callArgs = mockMessagesCreate.mock.calls[0][0];

			expect(callArgs.system).toContain('combat');
		});
	});

	describe('Error handling with generationType', () => {
		it('should handle API errors with generationType', async () => {
			mockMessagesCreate.mockRejectedValue(new Error('API error'));

			await expect(
				sendChatMessage('Test', [], true, undefined, 'npc')
			).rejects.toThrow('API error');
		});

		it('should handle invalid API key with generationType', async () => {
			const Anthropic = (await import('@anthropic-ai/sdk')).default as any;
			const apiError = new Error('Invalid API key');
			(apiError as any).status = 401;
			mockMessagesCreate.mockRejectedValue(apiError);

			await expect(
				sendChatMessage('Test', [], true, undefined, 'npc')
			).rejects.toThrow();
		});

		it('should handle missing API key with any generationType', async () => {
			localStorage.getItem = vi.fn().mockReturnValue(null);

			await expect(
				sendChatMessage('Test', [], true, undefined, 'npc')
			).rejects.toThrow('API key not configured');
		});
	});

	describe('Edge cases', () => {
		it('should handle undefined generationType gracefully', async () => {
			await expect(
				sendChatMessage('Test', [], true, undefined, undefined as any)
			).resolves.not.toThrow();
		});

		it('should handle null generationType gracefully', async () => {
			await expect(
				sendChatMessage('Test', [], true, undefined, null as any)
			).resolves.not.toThrow();
		});

		it('should handle empty string message with generationType', async () => {
			// Service should still be called even with empty message
			// (validation happens at store level)
			await sendChatMessage('', [], true, undefined, 'npc');

			expect(mockMessagesCreate).toHaveBeenCalled();
		});

		it('should handle all parameters with generationType', async () => {
			const onStream = vi.fn();

			await sendChatMessage(
				'Full test message',
				['entity-1', 'entity-2'],
				false,
				onStream,
				'combat'
			);

			expect(mockMessagesStream).toHaveBeenCalled();
		});

		it('should handle rapid calls with different generation types', async () => {
			await sendChatMessage('Test 1', [], true, undefined, 'npc');
			await sendChatMessage('Test 2', [], true, undefined, 'location');
			await sendChatMessage('Test 3', [], true, undefined, 'combat');

			expect(mockMessagesCreate).toHaveBeenCalledTimes(3);
		});
	});

	describe('Prompt template format', () => {
		it('should maintain proper prompt structure with type template', async () => {
			await sendChatMessage('Test', [], true, undefined, 'npc');

			const callArgs = mockMessagesCreate.mock.calls[0][0];
			const systemPrompt = callArgs.system;

			// Should be well-formatted
			expect(systemPrompt).toBeTruthy();
			expect(systemPrompt.length).toBeGreaterThan(50);
		});

		it('should have clear separation between base and type prompts', async () => {
			await sendChatMessage('Test', [], true, undefined, 'npc');

			const callArgs = mockMessagesCreate.mock.calls[0][0];
			const systemPrompt = callArgs.system;

			// Should have newlines separating sections
			expect(systemPrompt).toContain('\n');
		});

		it('should not duplicate prompts', async () => {
			await sendChatMessage('Test', [], true, undefined, 'npc');

			const callArgs = mockMessagesCreate.mock.calls[0][0];
			const systemPrompt = callArgs.system;

			// Count occurrences of base prompt
			const matches = systemPrompt.match(/TTRPG campaign assistant/g);
			expect(matches?.length).toBe(1);
		});
	});

	describe('Integration with existing functionality', () => {
		it('should work with conversation history and generationType', async () => {
			// Mock chat repository to return history
			const { chatRepository } = await import('$lib/db/repositories');
			(chatRepository.getRecent as any).mockReturnValue({
				subscribe: vi.fn((observer: any) => {
					observer.next([
						{ id: 'msg-1', role: 'user', content: 'Previous message', timestamp: new Date() }
					]);
					return { unsubscribe: vi.fn() };
				})
			});

			await sendChatMessage('New message', [], true, undefined, 'npc');

			expect(mockMessagesCreate).toHaveBeenCalled();
			const callArgs = mockMessagesCreate.mock.calls[0][0];

			// Should include conversation history
			expect(callArgs.messages).toBeDefined();
			expect(Array.isArray(callArgs.messages)).toBe(true);
		});

		it('should work with model selection and generationType', async () => {
			const { getSelectedModel } = await import('./modelService');
			(getSelectedModel as any).mockReturnValue('claude-opus-4-5-20251101');

			await sendChatMessage('Test', [], true, undefined, 'npc');

			const callArgs = mockMessagesCreate.mock.calls[0][0];
			expect(callArgs.model).toBe('claude-opus-4-5-20251101');
		});

		it('should respect max tokens with generationType', async () => {
			await sendChatMessage('Test', [], true, undefined, 'npc');

			const callArgs = mockMessagesCreate.mock.calls[0][0];
			expect(callArgs.max_tokens).toBe(4096);
		});
	});

	describe('Type-specific behavior verification', () => {
		it('should produce different prompts for different types', async () => {
			await sendChatMessage('Test', [], true, undefined, 'npc');
			const npcPrompt = mockMessagesCreate.mock.calls[0][0].system;

			mockMessagesCreate.mockClear();

			await sendChatMessage('Test', [], true, undefined, 'location');
			const locationPrompt = mockMessagesCreate.mock.calls[0][0].system;

			expect(npcPrompt).not.toEqual(locationPrompt);
		});

		it('should have longer prompts for specialized types vs custom', async () => {
			await sendChatMessage('Test', [], true, undefined, 'custom');
			const customPromptLength = mockMessagesCreate.mock.calls[0][0].system.length;

			mockMessagesCreate.mockClear();

			await sendChatMessage('Test', [], true, undefined, 'npc');
			const npcPromptLength = mockMessagesCreate.mock.calls[0][0].system.length;

			expect(npcPromptLength).toBeGreaterThan(customPromptLength);
		});

		it('should include type-appropriate keywords in prompts', async () => {
			const typeKeywords: Record<GenerationType, RegExp> = {
				custom: /general|assist/i,
				npc: /npc|character|personality/i,
				location: /location|place|atmosphere/i,
				plot_hook: /plot|hook|story/i,
				combat: /encounter|combat|battle/i,
				item: /item|artifact|equipment/i,
				faction: /faction|organization|guild/i,
				session_prep: /session|prep|planning/i
			};

			for (const [type, keyword] of Object.entries(typeKeywords)) {
				mockMessagesCreate.mockClear();
				await sendChatMessage('Test', [], true, undefined, type as GenerationType);

				const prompt = mockMessagesCreate.mock.calls[0][0].system;
				expect(prompt).toMatch(keyword);
			}
		});
	});

	describe('typeFieldValues integration (Issue #155)', () => {
		beforeEach(() => {
			mockMessagesCreate.mockClear();
			mockMessagesStream.mockClear();
		});

		describe('Parameter acceptance', () => {
			it('should accept typeFieldValues as 6th parameter', async () => {
				await expect(
					sendChatMessage('Test', [], true, undefined, 'npc', { threatLevel: 'elite' })
				).resolves.not.toThrow();
			});

			it('should accept empty typeFieldValues object', async () => {
				await expect(
					sendChatMessage('Test', [], true, undefined, 'npc', {})
				).resolves.not.toThrow();
			});

			it('should work without typeFieldValues parameter (backward compatibility)', async () => {
				await expect(
					sendChatMessage('Test', [], true, undefined, 'npc')
				).resolves.not.toThrow();
			});
		});

		describe('Threat Level in prompts', () => {
			it('should include threat level in prompt when threatLevel is set', async () => {
				await sendChatMessage('Generate NPC', [], true, undefined, 'npc', {
					threatLevel: 'elite'
				});

				expect(mockMessagesCreate).toHaveBeenCalled();
				const callArgs = mockMessagesCreate.mock.calls[0][0];
				const systemPrompt = callArgs.system.toLowerCase();

				expect(systemPrompt).toMatch(/elite|threat/);
			});

			it('should include minion threat level text', async () => {
				await sendChatMessage('Test', [], true, undefined, 'npc', {
					threatLevel: 'minion'
				});

				const systemPrompt = mockMessagesCreate.mock.calls[0][0].system.toLowerCase();
				expect(systemPrompt).toContain('minion');
			});

			it('should include standard threat level text', async () => {
				await sendChatMessage('Test', [], true, undefined, 'npc', {
					threatLevel: 'standard'
				});

				const systemPrompt = mockMessagesCreate.mock.calls[0][0].system.toLowerCase();
				expect(systemPrompt).toContain('standard');
			});

			it('should include elite threat level text', async () => {
				await sendChatMessage('Test', [], true, undefined, 'npc', {
					threatLevel: 'elite'
				});

				const systemPrompt = mockMessagesCreate.mock.calls[0][0].system.toLowerCase();
				expect(systemPrompt).toContain('elite');
			});

			it('should include boss threat level text', async () => {
				await sendChatMessage('Test', [], true, undefined, 'npc', {
					threatLevel: 'boss'
				});

				const systemPrompt = mockMessagesCreate.mock.calls[0][0].system.toLowerCase();
				expect(systemPrompt).toContain('boss');
			});

			it('should include solo threat level text', async () => {
				await sendChatMessage('Test', [], true, undefined, 'npc', {
					threatLevel: 'solo'
				});

				const systemPrompt = mockMessagesCreate.mock.calls[0][0].system.toLowerCase();
				expect(systemPrompt).toContain('solo');
			});

			it('should not include threat level text when not specified', async () => {
				await sendChatMessage('Test', [], true, undefined, 'npc', {});

				const systemPrompt = mockMessagesCreate.mock.calls[0][0].system;
				// Should not have placeholder text for threat level
				expect(systemPrompt).not.toMatch(/\{threatLevel\}|\{value\}/);
			});
		});

		describe('Combat Role in prompts', () => {
			it('should include combat role in prompt when combatRole is set', async () => {
				await sendChatMessage('Generate NPC', [], true, undefined, 'npc', {
					combatRole: 'brute'
				});

				expect(mockMessagesCreate).toHaveBeenCalled();
				const callArgs = mockMessagesCreate.mock.calls[0][0];
				const systemPrompt = callArgs.system.toLowerCase();

				expect(systemPrompt).toMatch(/brute|role|combat/);
			});

			it('should include all combat roles correctly', async () => {
				const combatRoles = [
					'ambusher', 'artillery', 'brute', 'controller', 'defender',
					'harrier', 'hexer', 'leader', 'mount', 'support'
				];

				for (const role of combatRoles) {
					mockMessagesCreate.mockClear();
					await sendChatMessage('Test', [], true, undefined, 'npc', {
						combatRole: role
					});

					const systemPrompt = mockMessagesCreate.mock.calls[0][0].system.toLowerCase();
					expect(systemPrompt).toContain(role);
				}
			});

			it('should not include combat role text when not specified', async () => {
				await sendChatMessage('Test', [], true, undefined, 'npc', {});

				const systemPrompt = mockMessagesCreate.mock.calls[0][0].system;
				// Should not have placeholder text for combat role
				expect(systemPrompt).not.toMatch(/\{combatRole\}|\{role\}/);
			});
		});

		describe('Combined typeFieldValues', () => {
			it('should include both threat level and combat role when both are set', async () => {
				await sendChatMessage('Generate NPC', [], true, undefined, 'npc', {
					threatLevel: 'boss',
					combatRole: 'artillery'
				});

				const systemPrompt = mockMessagesCreate.mock.calls[0][0].system.toLowerCase();

				expect(systemPrompt).toContain('boss');
				expect(systemPrompt).toContain('artillery');
			});

			it('should include only threat level when combat role is empty', async () => {
				await sendChatMessage('Test', [], true, undefined, 'npc', {
					threatLevel: 'elite',
					combatRole: ''
				});

				const systemPrompt = mockMessagesCreate.mock.calls[0][0].system.toLowerCase();

				expect(systemPrompt).toContain('elite');
				// Empty values should be excluded from prompt
			});

			it('should include only combat role when threat level is empty', async () => {
				await sendChatMessage('Test', [], true, undefined, 'npc', {
					threatLevel: '',
					combatRole: 'defender'
				});

				const systemPrompt = mockMessagesCreate.mock.calls[0][0].system.toLowerCase();

				expect(systemPrompt).toContain('defender');
			});

			it('should exclude both when both are empty strings', async () => {
				await sendChatMessage('Test', [], true, undefined, 'npc', {
					threatLevel: '',
					combatRole: ''
				});

				const systemPrompt = mockMessagesCreate.mock.calls[0][0].system;

				// Should not have any placeholder markers
				expect(systemPrompt).not.toMatch(/\{value\}|\{threatLevel\}|\{combatRole\}/);
			});
		});

		describe('Integration with other parameters', () => {
			it('should work with typeFieldValues and context entities', async () => {
				mockBuildContext.mockResolvedValue([
					{ id: 'entity-1', name: 'Test Entity', type: 'npc' }
				]);
				mockFormatContextForPrompt.mockReturnValue('# Campaign Context');

				await sendChatMessage('Test', ['entity-1'], true, undefined, 'npc', {
					threatLevel: 'elite',
					combatRole: 'brute'
				});

				const systemPrompt = mockMessagesCreate.mock.calls[0][0].system;

				expect(systemPrompt).toContain('Campaign Context');
				expect(systemPrompt.toLowerCase()).toContain('elite');
				expect(systemPrompt.toLowerCase()).toContain('brute');
			});

			it('should work with typeFieldValues and streaming', async () => {
				const onStream = vi.fn();

				await sendChatMessage('Test', [], true, onStream, 'npc', {
					threatLevel: 'boss',
					combatRole: 'leader'
				});

				expect(mockMessagesStream).toHaveBeenCalled();
				const systemPrompt = mockMessagesStream.mock.calls[0][0].system.toLowerCase();

				expect(systemPrompt).toContain('boss');
				expect(systemPrompt).toContain('leader');
			});

			it('should work with all parameters combined', async () => {
				mockBuildContext.mockResolvedValue([]);
				mockFormatContextForPrompt.mockReturnValue('');

				const onStream = vi.fn();

				await sendChatMessage(
					'Generate powerful NPC',
					['entity-1', 'entity-2'],
					false,
					onStream,
					'npc',
					{ threatLevel: 'solo', combatRole: 'hexer' }
				);

				expect(mockMessagesStream).toHaveBeenCalled();
				const callArgs = mockMessagesStream.mock.calls[0][0];
				const systemPrompt = callArgs.system.toLowerCase();

				expect(systemPrompt).toContain('solo');
				expect(systemPrompt).toContain('hexer');
			});
		});

		describe('Prompt template substitution', () => {
			it('should properly format threat level in prompt template', async () => {
				await sendChatMessage('Test', [], true, undefined, 'npc', {
					threatLevel: 'elite'
				});

				const systemPrompt = mockMessagesCreate.mock.calls[0][0].system;

				// Should not have raw template placeholders
				expect(systemPrompt).not.toContain('{value}');
				expect(systemPrompt).not.toContain('{threatLevel}');

				// Should have the actual value
				expect(systemPrompt.toLowerCase()).toContain('elite');
			});

			it('should properly format combat role in prompt template', async () => {
				await sendChatMessage('Test', [], true, undefined, 'npc', {
					combatRole: 'controller'
				});

				const systemPrompt = mockMessagesCreate.mock.calls[0][0].system;

				// Should not have raw template placeholders
				expect(systemPrompt).not.toContain('{role}');
				expect(systemPrompt).not.toContain('{combatRole}');

				// Should have the actual value
				expect(systemPrompt.toLowerCase()).toContain('controller');
			});

			it('should append typeField prompts to system prompt', async () => {
				await sendChatMessage('Test', [], true, undefined, 'npc', {
					threatLevel: 'boss'
				});

				const systemPrompt = mockMessagesCreate.mock.calls[0][0].system;

				// Should have base prompt
				expect(systemPrompt).toContain('TTRPG campaign assistant');

				// Should have NPC type prompt
				expect(systemPrompt).toContain('NPC');

				// Should have threat level
				expect(systemPrompt.toLowerCase()).toContain('boss');
			});
		});

		describe('Non-NPC types with typeFieldValues', () => {
			it('should ignore typeFieldValues for custom type', async () => {
				await sendChatMessage('Test', [], true, undefined, 'custom', {
					threatLevel: 'elite'
				});

				const systemPrompt = mockMessagesCreate.mock.calls[0][0].system;

				// Custom type should not process NPC-specific fields
				// But the call should not fail
				expect(mockMessagesCreate).toHaveBeenCalled();
			});

			it('should ignore typeFieldValues for location type', async () => {
				await sendChatMessage('Test', [], true, undefined, 'location', {
					combatRole: 'brute'
				});

				expect(mockMessagesCreate).toHaveBeenCalled();
			});

			it('should handle typeFieldValues for all non-NPC types gracefully', async () => {
				const nonNpcTypes: GenerationType[] = [
					'custom', 'location', 'plot_hook', 'combat', 'item', 'faction', 'session_prep'
				];

				for (const type of nonNpcTypes) {
					mockMessagesCreate.mockClear();
					await expect(
						sendChatMessage('Test', [], true, undefined, type, {
							threatLevel: 'elite',
							combatRole: 'brute'
						})
					).resolves.not.toThrow();

					expect(mockMessagesCreate).toHaveBeenCalled();
				}
			});
		});

		describe('Edge cases', () => {
			it('should handle undefined typeFieldValues', async () => {
				await expect(
					sendChatMessage('Test', [], true, undefined, 'npc', undefined)
				).resolves.not.toThrow();
			});

			it('should handle null typeFieldValues', async () => {
				await expect(
					sendChatMessage('Test', [], true, undefined, 'npc', null as any)
				).resolves.not.toThrow();
			});

			it('should handle unknown field keys', async () => {
				await expect(
					sendChatMessage('Test', [], true, undefined, 'npc', {
						unknownField: 'some-value'
					} as any)
				).resolves.not.toThrow();
			});

			it('should handle very long field values', async () => {
				await expect(
					sendChatMessage('Test', [], true, undefined, 'npc', {
						threatLevel: 'elite'.repeat(100)
					})
				).resolves.not.toThrow();
			});

			it('should handle special characters in field values', async () => {
				await expect(
					sendChatMessage('Test', [], true, undefined, 'npc', {
						threatLevel: 'elite<script>alert("xss")</script>'
					})
				).resolves.not.toThrow();
			});
		});

		describe('Error handling', () => {
			it('should handle API errors with typeFieldValues', async () => {
				mockMessagesCreate.mockRejectedValue(new Error('API error'));

				await expect(
					sendChatMessage('Test', [], true, undefined, 'npc', {
						threatLevel: 'boss',
						combatRole: 'artillery'
					})
				).rejects.toThrow('API error');
			});

			it('should handle missing API key with typeFieldValues', async () => {
				localStorage.getItem = vi.fn().mockReturnValue(null);

				await expect(
					sendChatMessage('Test', [], true, undefined, 'npc', {
						threatLevel: 'elite'
					})
				).rejects.toThrow('API key not configured');
			});
		});

		describe('Prompt length and structure', () => {
			it('should increase prompt length when typeFieldValues are included', async () => {
				await sendChatMessage('Test', [], true, undefined, 'npc', {});
				const emptyFieldsLength = mockMessagesCreate.mock.calls[0][0].system.length;

				mockMessagesCreate.mockClear();

				await sendChatMessage('Test', [], true, undefined, 'npc', {
					threatLevel: 'elite',
					combatRole: 'brute'
				});
				const withFieldsLength = mockMessagesCreate.mock.calls[0][0].system.length;

				expect(withFieldsLength).toBeGreaterThan(emptyFieldsLength);
			});

			it('should maintain proper prompt formatting with typeFieldValues', async () => {
				await sendChatMessage('Test', [], true, undefined, 'npc', {
					threatLevel: 'boss',
					combatRole: 'leader'
				});

				const systemPrompt = mockMessagesCreate.mock.calls[0][0].system;

				// Should be well-formatted
				expect(systemPrompt).toBeTruthy();
				expect(systemPrompt.length).toBeGreaterThan(100);

				// Should have proper sections
				expect(systemPrompt).toContain('TTRPG campaign assistant');
				expect(systemPrompt).toContain('NPC');
			});
		});
	});
});
