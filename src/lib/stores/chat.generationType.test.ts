/**
 * Tests for Chat Store - Generation Type Extension (TDD RED Phase)
 *
 * Issue #41: Generation Type Selector in Chat
 *
 * This test suite covers the new generation type functionality added to the chat store.
 * It extends the existing chat store with:
 * - generationType state
 * - setGenerationType() method
 * - Integration with sendMessage() to pass generationType to chatService
 *
 * Coverage:
 * - Initial state (defaults to 'custom')
 * - setGenerationType() method
 * - sendMessage() integration with generationType
 * - State independence
 * - Edge cases and validation
 *
 * These tests are expected to FAIL initially (RED phase).
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { GenerationType } from '$lib/types';

describe('Chat Store - Generation Type Extension', () => {
	let chatStore: any;
	let mockChatRepository: any;
	let mockSendChatMessage: any;
	let mockObservable: any;
	let observerCallback: any;

	beforeEach(async () => {
		vi.clearAllMocks();
		vi.clearAllTimers();

		// Create mock observer callback capture
		observerCallback = null;

		// Mock chat repository with observable
		mockObservable = {
			subscribe: vi.fn((observer: any) => {
				observerCallback = observer;
				return { unsubscribe: vi.fn() };
			})
		};

		mockChatRepository = {
			getAll: vi.fn(() => mockObservable),
			add: vi.fn(async (role: string, content: string, contextEntities?: string[]) => ({
				id: `msg-${Date.now()}`,
				role,
				content,
				timestamp: new Date(),
				contextEntities
			})),
			clearAll: vi.fn(async () => {})
		};

		mockSendChatMessage = vi.fn(async () => 'AI response');

		// Mock the dependencies
		vi.doMock('$lib/db/repositories', () => ({
			chatRepository: mockChatRepository,
			combatRepository: {
				getAll: vi.fn(() => ({ subscribe: vi.fn() })),
				create: vi.fn(),
				update: vi.fn(),
				delete: vi.fn()
			},
			montageRepository: {
				getAll: vi.fn(() => ({ subscribe: vi.fn() })),
				create: vi.fn(),
				update: vi.fn(),
				delete: vi.fn()
			},
			creatureRepository: {
				getAll: vi.fn(() => ({ subscribe: vi.fn() })),
				create: vi.fn(),
				update: vi.fn(),
				delete: vi.fn()
			},
			negotiationRepository: {
				getAll: vi.fn(() => ({ subscribe: vi.fn() })),
				create: vi.fn(),
				update: vi.fn(),
				delete: vi.fn()
			}
		}));

		vi.doMock('$lib/services/chatService', () => ({
			sendChatMessage: mockSendChatMessage
		}));

		// Import fresh store instance
		vi.resetModules();
		const module = await import('./chat.svelte');
		chatStore = module.chatStore;
	});

	afterEach(() => {
		vi.useRealTimers();
		vi.restoreAllMocks();
	});

	describe('Initial State', () => {
		it('should have generationType property defined', () => {
			expect(chatStore).toHaveProperty('generationType');
		});

		it('should initialize with generationType as "custom"', () => {
			expect(chatStore.generationType).toBe('custom');
		});

		it('should have setGenerationType method defined', () => {
			expect(chatStore).toHaveProperty('setGenerationType');
			expect(typeof chatStore.setGenerationType).toBe('function');
		});

		it('should not affect other initial state', () => {
			expect(chatStore.messages).toBeDefined();
			expect(chatStore.isLoading).toBe(false);
			expect(chatStore.error).toBe(null);
			expect(chatStore.contextEntityIds).toBeDefined();
		});
	});

	describe('setGenerationType() Method', () => {
		it('should set generationType to "npc"', () => {
			chatStore.setGenerationType('npc');
			expect(chatStore.generationType).toBe('npc');
		});

		it('should set generationType to "location"', () => {
			chatStore.setGenerationType('location');
			expect(chatStore.generationType).toBe('location');
		});

		it('should set generationType to "plot_hook"', () => {
			chatStore.setGenerationType('plot_hook');
			expect(chatStore.generationType).toBe('plot_hook');
		});

		it('should set generationType to "encounter"', () => {
			chatStore.setGenerationType('combat');
			expect(chatStore.generationType).toBe('combat');
		});

		it('should set generationType to "item"', () => {
			chatStore.setGenerationType('item');
			expect(chatStore.generationType).toBe('item');
		});

		it('should set generationType to "faction"', () => {
			chatStore.setGenerationType('faction');
			expect(chatStore.generationType).toBe('faction');
		});

		it('should set generationType to "session_prep"', () => {
			chatStore.setGenerationType('session_prep');
			expect(chatStore.generationType).toBe('session_prep');
		});

		it('should set generationType back to "custom"', () => {
			chatStore.setGenerationType('npc');
			expect(chatStore.generationType).toBe('npc');

			chatStore.setGenerationType('custom');
			expect(chatStore.generationType).toBe('custom');
		});

		it('should allow changing generationType multiple times', () => {
			chatStore.setGenerationType('npc');
			expect(chatStore.generationType).toBe('npc');

			chatStore.setGenerationType('location');
			expect(chatStore.generationType).toBe('location');

			chatStore.setGenerationType('combat');
			expect(chatStore.generationType).toBe('combat');
		});

		it('should not affect other state when changing generationType', () => {
			chatStore.setContextEntities(['entity-1']);
			chatStore.setIncludeLinkedEntities(false);

			chatStore.setGenerationType('npc');

			expect(chatStore.contextEntityIds).toEqual(['entity-1']);
			expect(chatStore.includeLinkedEntities).toBe(false);
			expect(chatStore.isLoading).toBe(false);
			expect(chatStore.error).toBe(null);
		});

		it('should persist generationType across multiple operations', () => {
			chatStore.setGenerationType('npc');

			chatStore.setContextEntities(['entity-1']);
			expect(chatStore.generationType).toBe('npc');

			chatStore.clearContextEntities();
			expect(chatStore.generationType).toBe('npc');
		});

		it('should handle setting same generationType multiple times', () => {
			chatStore.setGenerationType('npc');
			chatStore.setGenerationType('npc');
			chatStore.setGenerationType('npc');

			expect(chatStore.generationType).toBe('npc');
		});
	});

	describe('sendMessage() Integration with generationType', () => {
		beforeEach(async () => {
			await chatStore.load();
		});

		it('should pass generationType to sendChatMessage', async () => {
			mockSendChatMessage.mockResolvedValue('Response');

			chatStore.setGenerationType('npc');
			await chatStore.sendMessage('Generate an NPC');

			expect(mockSendChatMessage).toHaveBeenCalledWith(
				'Generate an NPC',
				expect.any(Array),
				expect.any(Boolean),
				expect.any(Function),
				'npc', // generationType should be passed as 5th argument
				expect.any(Object), // typeFieldValues should be passed as 6th argument
				expect.any(Boolean), // sendAllContext
				expect.any(String) // contextDetailLevel
			);
		});

		it('should pass "custom" generationType by default', async () => {
			mockSendChatMessage.mockResolvedValue('Response');

			await chatStore.sendMessage('Test message');

			expect(mockSendChatMessage).toHaveBeenCalledWith(
				'Test message',
				expect.any(Array),
				expect.any(Boolean),
				expect.any(Function),
				'custom',
				expect.any(Object), // typeFieldValues
				expect.any(Boolean), // sendAllContext
				expect.any(String) // contextDetailLevel
			);
		});

		it('should pass correct generationType for each type', async () => {
			mockSendChatMessage.mockResolvedValue('Response');

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
				mockSendChatMessage.mockClear();
				chatStore.setGenerationType(type);
				await chatStore.sendMessage(`Generate a ${type}`);

				expect(mockSendChatMessage).toHaveBeenCalledWith(
					expect.any(String),
					expect.any(Array),
					expect.any(Boolean),
					expect.any(Function),
					type,
					expect.any(Object), // typeFieldValues
					expect.any(Boolean), // sendAllContext
					expect.any(String) // contextDetailLevel
				);
			}
		});

		it('should pass generationType along with contextEntityIds', async () => {
			mockSendChatMessage.mockResolvedValue('Response');

			chatStore.setContextEntities(['entity-1', 'entity-2']);
			chatStore.setGenerationType('npc');
			await chatStore.sendMessage('Generate NPC');

			expect(mockSendChatMessage).toHaveBeenCalledWith(
				'Generate NPC',
				['entity-1', 'entity-2'],
				expect.any(Boolean),
				expect.any(Function),
				'npc',
				expect.any(Object), // typeFieldValues
				expect.any(Boolean), // sendAllContext
				expect.any(String) // contextDetailLevel
			);
		});

		it('should pass generationType along with includeLinkedEntities', async () => {
			mockSendChatMessage.mockResolvedValue('Response');

			chatStore.setIncludeLinkedEntities(false);
			chatStore.setGenerationType('location');
			await chatStore.sendMessage('Generate location');

			expect(mockSendChatMessage).toHaveBeenCalledWith(
				'Generate location',
				expect.any(Array),
				false,
				expect.any(Function),
				'location',
				expect.any(Object), // typeFieldValues
				expect.any(Boolean), // sendAllContext
				expect.any(String) // contextDetailLevel
			);
		});

		it('should pass generationType with streaming callback', async () => {
			mockSendChatMessage.mockImplementation(
				async (
					content: string,
					entityIds: string[],
					includeLinked: boolean,
					onStream: Function,
					generationType: GenerationType
				) => {
					onStream('Streaming...');
					expect(generationType).toBe('combat');
					return 'Response';
				}
			);

			chatStore.setGenerationType('combat');
			await chatStore.sendMessage('Generate encounter');

			expect(mockSendChatMessage).toHaveBeenCalled();
		});

		it('should maintain current generationType after sending message', async () => {
			mockSendChatMessage.mockResolvedValue('Response');

			chatStore.setGenerationType('npc');
			await chatStore.sendMessage('Test');

			expect(chatStore.generationType).toBe('npc');
		});

		it('should use updated generationType if changed before message completes', async () => {
			mockSendChatMessage.mockImplementation(async () => {
				// Simulate delay
				await new Promise((resolve) => setTimeout(resolve, 10));
				return 'Response';
			});

			chatStore.setGenerationType('npc');
			const sendPromise = chatStore.sendMessage('Test');

			// Change generationType while message is being sent
			chatStore.setGenerationType('location');

			await sendPromise;

			// The message should have been sent with 'npc' (captured at send time)
			// But current state should be 'location'
			expect(chatStore.generationType).toBe('location');
		});

		it('should handle errors without affecting generationType', async () => {
			mockSendChatMessage.mockRejectedValue(new Error('API error'));

			chatStore.setGenerationType('npc');
			await chatStore.sendMessage('Test');

			expect(chatStore.generationType).toBe('npc');
			expect(chatStore.error).toBe('API error');
		});

		it('should ignore empty messages regardless of generationType', async () => {
			chatStore.setGenerationType('npc');
			await chatStore.sendMessage('');

			expect(mockSendChatMessage).not.toHaveBeenCalled();
		});

		it('should ignore whitespace messages regardless of generationType', async () => {
			chatStore.setGenerationType('location');
			await chatStore.sendMessage('   ');

			expect(mockSendChatMessage).not.toHaveBeenCalled();
		});
	});

	describe('State Independence', () => {
		it('should not affect loading state when changing generationType', () => {
			const initialLoading = chatStore.isLoading;

			chatStore.setGenerationType('npc');
			chatStore.setGenerationType('location');
			chatStore.setGenerationType('custom');

			expect(chatStore.isLoading).toBe(initialLoading);
		});

		it('should not affect error state when changing generationType', () => {
			expect(chatStore.error).toBe(null);

			chatStore.setGenerationType('npc');
			chatStore.setGenerationType('location');

			expect(chatStore.error).toBe(null);
		});

		it('should not affect messages when changing generationType', async () => {
			await chatStore.load();
			observerCallback.next([
				{ id: 'msg-1', role: 'user', content: 'Test', timestamp: new Date() }
			]);

			expect(chatStore.messages.length).toBe(1);

			chatStore.setGenerationType('npc');

			expect(chatStore.messages.length).toBe(1);
		});

		it('should not affect streaming content when changing generationType', () => {
			expect(chatStore.streamingContent).toBe('');

			chatStore.setGenerationType('npc');

			expect(chatStore.streamingContent).toBe('');
		});

		it('should not reset contextEntityIds when changing generationType', () => {
			chatStore.setContextEntities(['entity-1', 'entity-2']);

			chatStore.setGenerationType('npc');

			expect(chatStore.contextEntityIds).toEqual(['entity-1', 'entity-2']);
		});

		it('should not reset includeLinkedEntities when changing generationType', () => {
			chatStore.setIncludeLinkedEntities(false);

			chatStore.setGenerationType('location');

			expect(chatStore.includeLinkedEntities).toBe(false);
		});
	});

	describe('Integration with other store operations', () => {
		it('should preserve generationType when loading messages', async () => {
			chatStore.setGenerationType('npc');

			await chatStore.load();

			expect(chatStore.generationType).toBe('npc');
		});

		it('should preserve generationType when clearing history', async () => {
			chatStore.setGenerationType('location');

			await chatStore.clearHistory();

			expect(chatStore.generationType).toBe('location');
		});

		it('should preserve generationType when setting context entities', () => {
			chatStore.setGenerationType('combat');

			chatStore.setContextEntities(['entity-1']);
			chatStore.addContextEntity('entity-2');
			chatStore.removeContextEntity('entity-1');

			expect(chatStore.generationType).toBe('combat');
		});

		it('should preserve generationType when toggling includeLinkedEntities', () => {
			chatStore.setGenerationType('item');

			chatStore.setIncludeLinkedEntities(false);
			chatStore.setIncludeLinkedEntities(true);

			expect(chatStore.generationType).toBe('item');
		});

		it('should support complete workflow with generationType', async () => {
			mockSendChatMessage.mockResolvedValue('Response');

			// Load
			await chatStore.load();

			// Set generation type
			chatStore.setGenerationType('npc');
			expect(chatStore.generationType).toBe('npc');

			// Set context
			chatStore.setContextEntities(['entity-1']);

			// Send message
			await chatStore.sendMessage('Generate NPC');
			expect(mockSendChatMessage).toHaveBeenCalledWith(
				'Generate NPC',
				['entity-1'],
				expect.any(Boolean),
				expect.any(Function),
				'npc',
				expect.any(Object), // typeFieldValues
				expect.any(Boolean), // sendAllContext
				expect.any(String) // contextDetailLevel
			);

			// Change generation type
			chatStore.setGenerationType('location');
			expect(chatStore.generationType).toBe('location');

			// Send another message
			await chatStore.sendMessage('Generate location');
			expect(mockSendChatMessage).toHaveBeenLastCalledWith(
				'Generate location',
				['entity-1'],
				expect.any(Boolean),
				expect.any(Function),
				'location',
				expect.any(Object), // typeFieldValues
				expect.any(Boolean), // sendAllContext
				expect.any(String) // contextDetailLevel
			);

			// Clear history shouldn't affect type
			await chatStore.clearHistory();
			expect(chatStore.generationType).toBe('location');
		});
	});

	describe('Reactivity', () => {
		it('should update generationType reactively', () => {
			expect(chatStore.generationType).toBe('custom');

			chatStore.setGenerationType('npc');

			expect(chatStore.generationType).toBe('npc');
		});

		it('should be observable in Svelte components', () => {
			// Test that accessing generationType returns current value
			const type1 = chatStore.generationType;
			expect(type1).toBe('custom');

			chatStore.setGenerationType('location');

			const type2 = chatStore.generationType;
			expect(type2).toBe('location');
			expect(type2).not.toBe(type1);
		});

		it('should support rapid changes', () => {
			const types: GenerationType[] = [
				'npc',
				'location',
				'plot_hook',
				'combat',
				'item',
				'faction',
				'session_prep',
				'custom'
			];

			types.forEach((type) => {
				chatStore.setGenerationType(type);
				expect(chatStore.generationType).toBe(type);
			});
		});
	});

	describe('Edge Cases', () => {
		it('should handle setting generationType before loading', () => {
			// Don't call load()
			chatStore.setGenerationType('npc');
			expect(chatStore.generationType).toBe('npc');
		});

		it('should handle setting generationType during message send', async () => {
			mockSendChatMessage.mockImplementation(async () => {
				await new Promise((resolve) => setTimeout(resolve, 10));
				return 'Response';
			});

			chatStore.setGenerationType('npc');
			const sendPromise = chatStore.sendMessage('Test');

			chatStore.setGenerationType('location');

			await sendPromise;

			expect(chatStore.generationType).toBe('location');
		});

		it('should handle rapid generationType changes', () => {
			for (let i = 0; i < 100; i++) {
				chatStore.setGenerationType(i % 2 === 0 ? 'npc' : 'location');
			}

			// Last iteration is i=99, which is odd, so 'location' is set last
			expect(chatStore.generationType).toBe('location');
		});

		it('should handle complete state reset including generationType', async () => {
			mockSendChatMessage.mockResolvedValue('Response');

			// Setup state
			chatStore.setGenerationType('npc');
			chatStore.setContextEntities(['entity-1']);
			chatStore.setIncludeLinkedEntities(false);
			await chatStore.sendMessage('Test');

			// Reset to defaults
			chatStore.setGenerationType('custom');
			chatStore.clearContextEntities();
			chatStore.setIncludeLinkedEntities(true);
			await chatStore.clearHistory();

			// Verify clean state
			expect(chatStore.generationType).toBe('custom');
			expect(chatStore.contextEntityIds).toEqual([]);
			expect(chatStore.includeLinkedEntities).toBe(true);
			expect(chatStore.messages).toEqual([]);
		});
	});

	describe('Type Safety', () => {
		it('should accept all valid GenerationType values', () => {
			const validTypes: GenerationType[] = [
				'custom',
				'npc',
				'location',
				'plot_hook',
				'combat',
				'item',
				'faction',
				'session_prep'
			];

			validTypes.forEach((type) => {
				expect(() => chatStore.setGenerationType(type)).not.toThrow();
			});
		});

		it('should have generationType as GenerationType type', () => {
			chatStore.setGenerationType('npc');
			const type: GenerationType = chatStore.generationType;
			expect(type).toBe('npc');
		});
	});

	describe('typeFieldValues state (Issue #155)', () => {
		beforeEach(async () => {
			await chatStore.load();
		});

		describe('Initial State', () => {
			it('should have typeFieldValues property defined', () => {
				expect(chatStore).toHaveProperty('typeFieldValues');
			});

			it('should initialize with empty typeFieldValues object', () => {
				expect(chatStore.typeFieldValues).toEqual({});
			});

			it('should have setTypeFieldValue method defined', () => {
				expect(chatStore).toHaveProperty('setTypeFieldValue');
				expect(typeof chatStore.setTypeFieldValue).toBe('function');
			});

			it('should have clearTypeFieldValues method defined', () => {
				expect(chatStore).toHaveProperty('clearTypeFieldValues');
				expect(typeof chatStore.clearTypeFieldValues).toBe('function');
			});
		});

		describe('setTypeFieldValue() method', () => {
			it('should set a single field value', () => {
				chatStore.setTypeFieldValue('threatLevel', 'elite');
				expect(chatStore.typeFieldValues).toEqual({ threatLevel: 'elite' });
			});

			it('should set multiple field values independently', () => {
				chatStore.setTypeFieldValue('threatLevel', 'boss');
				chatStore.setTypeFieldValue('combatRole', 'brute');

				expect(chatStore.typeFieldValues).toEqual({
					threatLevel: 'boss',
					combatRole: 'brute'
				});
			});

			it('should update existing field value', () => {
				chatStore.setTypeFieldValue('threatLevel', 'minion');
				expect(chatStore.typeFieldValues.threatLevel).toBe('minion');

				chatStore.setTypeFieldValue('threatLevel', 'solo');
				expect(chatStore.typeFieldValues.threatLevel).toBe('solo');
			});

			it('should preserve other field values when updating one', () => {
				chatStore.setTypeFieldValue('threatLevel', 'elite');
				chatStore.setTypeFieldValue('combatRole', 'defender');

				chatStore.setTypeFieldValue('threatLevel', 'boss');

				expect(chatStore.typeFieldValues).toEqual({
					threatLevel: 'boss',
					combatRole: 'defender'
				});
			});

			it('should accept all threat level values', () => {
				const threatLevels = ['minion', 'standard', 'elite', 'boss', 'solo'];

				threatLevels.forEach(level => {
					chatStore.setTypeFieldValue('threatLevel', level);
					expect(chatStore.typeFieldValues.threatLevel).toBe(level);
				});
			});

			it('should accept all combat role values', () => {
				const combatRoles = [
					'ambusher', 'artillery', 'brute', 'controller', 'defender',
					'harrier', 'hexer', 'leader', 'mount', 'support'
				];

				combatRoles.forEach(role => {
					chatStore.setTypeFieldValue('combatRole', role);
					expect(chatStore.typeFieldValues.combatRole).toBe(role);
				});
			});

			it('should handle empty string value', () => {
				chatStore.setTypeFieldValue('combatRole', '');
				expect(chatStore.typeFieldValues.combatRole).toBe('');
			});

			it('should not affect other chat store state', () => {
				chatStore.setGenerationType('npc');
				chatStore.setContextEntities(['entity-1']);

				chatStore.setTypeFieldValue('threatLevel', 'elite');

				expect(chatStore.generationType).toBe('npc');
				expect(chatStore.contextEntityIds).toEqual(['entity-1']);
				expect(chatStore.isLoading).toBe(false);
			});
		});

		describe('clearTypeFieldValues() method', () => {
			it('should clear all type field values', () => {
				chatStore.setTypeFieldValue('threatLevel', 'boss');
				chatStore.setTypeFieldValue('combatRole', 'artillery');

				chatStore.clearTypeFieldValues();

				expect(chatStore.typeFieldValues).toEqual({});
			});

			it('should work when typeFieldValues is already empty', () => {
				chatStore.clearTypeFieldValues();
				expect(chatStore.typeFieldValues).toEqual({});
			});

			it('should not affect other chat store state', () => {
				chatStore.setGenerationType('npc');
				chatStore.setContextEntities(['entity-1']);
				chatStore.setTypeFieldValue('threatLevel', 'elite');

				chatStore.clearTypeFieldValues();

				expect(chatStore.generationType).toBe('npc');
				expect(chatStore.contextEntityIds).toEqual(['entity-1']);
			});
		});

		describe('setGenerationType() integration', () => {
			it('should clear typeFieldValues when changing generation type', () => {
				chatStore.setGenerationType('npc');
				chatStore.setTypeFieldValue('threatLevel', 'elite');
				chatStore.setTypeFieldValue('combatRole', 'brute');

				chatStore.setGenerationType('location');

				expect(chatStore.typeFieldValues).toEqual({});
			});

			it('should clear typeFieldValues when switching to custom', () => {
				chatStore.setGenerationType('npc');
				chatStore.setTypeFieldValue('threatLevel', 'boss');

				chatStore.setGenerationType('custom');

				expect(chatStore.typeFieldValues).toEqual({});
			});

			it('should clear typeFieldValues when switching from custom to NPC', () => {
				chatStore.setGenerationType('custom');

				chatStore.setGenerationType('npc');

				expect(chatStore.typeFieldValues).toEqual({});
			});

			it('should clear typeFieldValues between different specialized types', () => {
				chatStore.setGenerationType('npc');
				chatStore.setTypeFieldValue('threatLevel', 'elite');

				chatStore.setGenerationType('combat');
				expect(chatStore.typeFieldValues).toEqual({});
			});
		});

		describe('sendMessage() integration with typeFieldValues', () => {
			it('should pass typeFieldValues to sendChatMessage', async () => {
				mockSendChatMessage.mockResolvedValue('Response');

				chatStore.setGenerationType('npc');
				chatStore.setTypeFieldValue('threatLevel', 'elite');
				chatStore.setTypeFieldValue('combatRole', 'brute');

				await chatStore.sendMessage('Generate NPC');

				expect(mockSendChatMessage).toHaveBeenCalledWith(
					'Generate NPC',
					expect.any(Array),
					expect.any(Boolean),
					expect.any(Function),
					'npc',
					{ threatLevel: 'elite', combatRole: 'brute' },
					expect.any(Boolean), // sendAllContext
					expect.any(String) // contextDetailLevel
				);
			});

			it('should pass empty typeFieldValues when none are set', async () => {
				mockSendChatMessage.mockResolvedValue('Response');

				chatStore.setGenerationType('npc');
				await chatStore.sendMessage('Generate NPC');

				expect(mockSendChatMessage).toHaveBeenCalledWith(
					'Generate NPC',
					expect.any(Array),
					expect.any(Boolean),
					expect.any(Function),
					'npc',
					{},
					expect.any(Boolean), // sendAllContext
					expect.any(String) // contextDetailLevel
				);
			});

			it('should pass partial typeFieldValues when only some are set', async () => {
				mockSendChatMessage.mockResolvedValue('Response');

				chatStore.setGenerationType('npc');
				chatStore.setTypeFieldValue('threatLevel', 'standard');

				await chatStore.sendMessage('Generate NPC');

				expect(mockSendChatMessage).toHaveBeenCalledWith(
					'Generate NPC',
					expect.any(Array),
					expect.any(Boolean),
					expect.any(Function),
					'npc',
					{ threatLevel: 'standard' },
					expect.any(Boolean), // sendAllContext
					expect.any(String) // contextDetailLevel
				);
			});

			it('should maintain typeFieldValues after sending message', async () => {
				mockSendChatMessage.mockResolvedValue('Response');

				chatStore.setGenerationType('npc');
				chatStore.setTypeFieldValue('threatLevel', 'boss');

				await chatStore.sendMessage('Generate NPC');

				expect(chatStore.typeFieldValues).toEqual({ threatLevel: 'boss' });
			});

			it('should handle errors without affecting typeFieldValues', async () => {
				mockSendChatMessage.mockRejectedValue(new Error('API error'));

				chatStore.setGenerationType('npc');
				chatStore.setTypeFieldValue('combatRole', 'leader');

				await chatStore.sendMessage('Test');

				expect(chatStore.typeFieldValues).toEqual({ combatRole: 'leader' });
			});
		});

		describe('State persistence across operations', () => {
			it('should preserve typeFieldValues when loading messages', async () => {
				chatStore.setTypeFieldValue('threatLevel', 'elite');

				await chatStore.load();

				expect(chatStore.typeFieldValues).toEqual({ threatLevel: 'elite' });
			});

			it('should preserve typeFieldValues when clearing history', async () => {
				chatStore.setTypeFieldValue('combatRole', 'artillery');

				await chatStore.clearHistory();

				expect(chatStore.typeFieldValues).toEqual({ combatRole: 'artillery' });
			});

			it('should preserve typeFieldValues when modifying context entities', () => {
				chatStore.setTypeFieldValue('threatLevel', 'boss');

				chatStore.setContextEntities(['entity-1']);
				chatStore.addContextEntity('entity-2');
				chatStore.removeContextEntity('entity-1');

				expect(chatStore.typeFieldValues).toEqual({ threatLevel: 'boss' });
			});

			it('should preserve typeFieldValues when toggling includeLinkedEntities', () => {
				chatStore.setTypeFieldValue('combatRole', 'defender');

				chatStore.setIncludeLinkedEntities(false);
				chatStore.setIncludeLinkedEntities(true);

				expect(chatStore.typeFieldValues).toEqual({ combatRole: 'defender' });
			});
		});

		describe('Edge cases', () => {
			it('should handle rapid field value changes', () => {
				// 51 iterations (0-50) so last iteration i=50 is even -> 'minion'
				for (let i = 0; i <= 50; i++) {
					chatStore.setTypeFieldValue('threatLevel', i % 2 === 0 ? 'minion' : 'solo');
				}

				expect(chatStore.typeFieldValues.threatLevel).toBe('minion');
			});

			it('should handle setting same value multiple times', () => {
				chatStore.setTypeFieldValue('threatLevel', 'elite');
				chatStore.setTypeFieldValue('threatLevel', 'elite');
				chatStore.setTypeFieldValue('threatLevel', 'elite');

				expect(chatStore.typeFieldValues).toEqual({ threatLevel: 'elite' });
			});

			it('should handle clearing when already empty', () => {
				chatStore.clearTypeFieldValues();
				chatStore.clearTypeFieldValues();

				expect(chatStore.typeFieldValues).toEqual({});
			});

			it('should return new object reference after modifications', () => {
				const initial = chatStore.typeFieldValues;

				chatStore.setTypeFieldValue('threatLevel', 'boss');

				// Should be a different object reference for reactivity
				expect(chatStore.typeFieldValues).not.toBe(initial);
			});
		});

		describe('Reactivity', () => {
			it('should update typeFieldValues reactively', () => {
				expect(chatStore.typeFieldValues).toEqual({});

				chatStore.setTypeFieldValue('threatLevel', 'elite');

				expect(chatStore.typeFieldValues).toEqual({ threatLevel: 'elite' });
			});

			it('should be observable in Svelte components', () => {
				const values1 = chatStore.typeFieldValues;
				expect(values1).toEqual({});

				chatStore.setTypeFieldValue('combatRole', 'hexer');

				const values2 = chatStore.typeFieldValues;
				expect(values2).toEqual({ combatRole: 'hexer' });
				expect(values2).not.toBe(values1);
			});
		});
	});
});
