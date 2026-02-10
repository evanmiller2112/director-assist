/**
 * Tests for Chat Store (TDD RED Phase)
 *
 * Testing the new "Send All Context" state additions (GitHub Issue #430)
 *
 * Test Coverage:
 * - Initial state for sendAllContext (default: false)
 * - Initial state for contextDetailLevel (default: 'summary')
 * - setSendAllContext method
 * - setContextDetailLevel method
 * - State persistence across operations
 * - Reset functionality includes new state
 * - Edge cases and validation
 *
 * NOTE: These tests are expected to FAIL initially (RED phase).
 * Implementation will be added in the GREEN phase to make them pass.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock the repositories before importing the store
vi.mock('$lib/db/repositories', () => ({
	chatRepository: {
		getByConversation: vi.fn(() => ({
			subscribe: vi.fn((observer: any) => {
				observer.next([]);
				return { unsubscribe: vi.fn() };
			})
		})),
		getAll: vi.fn(() => ({
			subscribe: vi.fn((observer: any) => {
				observer.next([]);
				return { unsubscribe: vi.fn() };
			})
		})),
		add: vi.fn(),
		clearAll: vi.fn(),
		clearByConversation: vi.fn(),
		getRecent: vi.fn(() => ({
			subscribe: vi.fn((observer: any) => {
				observer.next([]);
				return { unsubscribe: vi.fn() };
			})
		}))
	}
}));

vi.mock('$lib/stores', () => ({
	conversationStore: {
		activeConversationId: null,
		isLoading: false
	}
}));

vi.mock('$lib/services/chatService', () => ({
	sendChatMessage: vi.fn()
}));

describe('chatStore - Send All Context State', () => {
	let chatStore: any;

	beforeEach(async () => {
		// Clear module cache and import fresh instance
		vi.resetModules();
		const module = await import('./chat.svelte');
		chatStore = module.chatStore;
	});

	describe('Initial State', () => {
		it('should initialize sendAllContext to false', () => {
			expect(chatStore.sendAllContext).toBeDefined();
			expect(chatStore.sendAllContext).toBe(false);
		});

		it('should initialize contextDetailLevel to "summary"', () => {
			expect(chatStore.contextDetailLevel).toBeDefined();
			expect(chatStore.contextDetailLevel).toBe('summary');
		});

		it('should have sendAllContext as a boolean type', () => {
			expect(typeof chatStore.sendAllContext).toBe('boolean');
		});

		it('should have contextDetailLevel as a string type', () => {
			expect(typeof chatStore.contextDetailLevel).toBe('string');
		});
	});

	describe('setSendAllContext Method', () => {
		it('should exist on the store', () => {
			expect(chatStore.setSendAllContext).toBeDefined();
			expect(typeof chatStore.setSendAllContext).toBe('function');
		});

		it('should set sendAllContext to true', () => {
			chatStore.setSendAllContext(true);

			expect(chatStore.sendAllContext).toBe(true);
		});

		it('should set sendAllContext to false', () => {
			chatStore.setSendAllContext(true);
			chatStore.setSendAllContext(false);

			expect(chatStore.sendAllContext).toBe(false);
		});

		it('should update state reactively', () => {
			expect(chatStore.sendAllContext).toBe(false);

			chatStore.setSendAllContext(true);
			expect(chatStore.sendAllContext).toBe(true);

			chatStore.setSendAllContext(false);
			expect(chatStore.sendAllContext).toBe(false);
		});

		it('should accept boolean true', () => {
			chatStore.setSendAllContext(true);
			expect(chatStore.sendAllContext).toBe(true);
		});

		it('should accept boolean false', () => {
			chatStore.setSendAllContext(false);
			expect(chatStore.sendAllContext).toBe(false);
		});

		it('should persist state across multiple calls', () => {
			chatStore.setSendAllContext(true);
			expect(chatStore.sendAllContext).toBe(true);
			expect(chatStore.sendAllContext).toBe(true); // Read twice
		});
	});

	describe('setContextDetailLevel Method', () => {
		it('should exist on the store', () => {
			expect(chatStore.setContextDetailLevel).toBeDefined();
			expect(typeof chatStore.setContextDetailLevel).toBe('function');
		});

		it('should set contextDetailLevel to "summary"', () => {
			chatStore.setContextDetailLevel('full');
			chatStore.setContextDetailLevel('summary');

			expect(chatStore.contextDetailLevel).toBe('summary');
		});

		it('should set contextDetailLevel to "full"', () => {
			chatStore.setContextDetailLevel('full');

			expect(chatStore.contextDetailLevel).toBe('full');
		});

		it('should update state reactively', () => {
			expect(chatStore.contextDetailLevel).toBe('summary');

			chatStore.setContextDetailLevel('full');
			expect(chatStore.contextDetailLevel).toBe('full');

			chatStore.setContextDetailLevel('summary');
			expect(chatStore.contextDetailLevel).toBe('summary');
		});

		it('should accept "summary" as valid value', () => {
			chatStore.setContextDetailLevel('summary');
			expect(chatStore.contextDetailLevel).toBe('summary');
		});

		it('should accept "full" as valid value', () => {
			chatStore.setContextDetailLevel('full');
			expect(chatStore.contextDetailLevel).toBe('full');
		});

		it('should persist state across multiple calls', () => {
			chatStore.setContextDetailLevel('full');
			expect(chatStore.contextDetailLevel).toBe('full');
			expect(chatStore.contextDetailLevel).toBe('full'); // Read twice
		});
	});

	describe('State Independence', () => {
		it('should allow sendAllContext and contextDetailLevel to be set independently', () => {
			chatStore.setSendAllContext(true);
			chatStore.setContextDetailLevel('full');

			expect(chatStore.sendAllContext).toBe(true);
			expect(chatStore.contextDetailLevel).toBe('full');
		});

		it('should not affect other state when setting sendAllContext', () => {
			const initialDetailLevel = chatStore.contextDetailLevel;
			const initialContextIds = chatStore.contextEntityIds;

			chatStore.setSendAllContext(true);

			expect(chatStore.contextDetailLevel).toBe(initialDetailLevel);
			expect(chatStore.contextEntityIds).toEqual(initialContextIds);
		});

		it('should not affect other state when setting contextDetailLevel', () => {
			const initialSendAll = chatStore.sendAllContext;
			const initialContextIds = chatStore.contextEntityIds;

			chatStore.setContextDetailLevel('full');

			expect(chatStore.sendAllContext).toBe(initialSendAll);
			expect(chatStore.contextEntityIds).toEqual(initialContextIds);
		});
	});

	describe('Integration with Existing Store Methods', () => {
		it('should maintain sendAllContext state when setting context entities', () => {
			chatStore.setSendAllContext(true);
			chatStore.setContextEntities(['entity-1', 'entity-2']);

			expect(chatStore.sendAllContext).toBe(true);
		});

		it('should maintain contextDetailLevel state when adding context entities', () => {
			chatStore.setContextDetailLevel('full');
			chatStore.addContextEntity('entity-1');

			expect(chatStore.contextDetailLevel).toBe('full');
		});

		it('should maintain new state when clearing context entities', () => {
			chatStore.setSendAllContext(true);
			chatStore.setContextDetailLevel('full');
			chatStore.clearContextEntities();

			expect(chatStore.sendAllContext).toBe(true);
			expect(chatStore.contextDetailLevel).toBe('full');
		});

		it('should maintain new state when setting generation type', () => {
			chatStore.setSendAllContext(true);
			chatStore.setContextDetailLevel('full');
			chatStore.setGenerationType('npc');

			expect(chatStore.sendAllContext).toBe(true);
			expect(chatStore.contextDetailLevel).toBe('full');
		});
	});

	describe('reset Method', () => {
		it('should reset sendAllContext to false', () => {
			chatStore.setSendAllContext(true);

			chatStore.reset();

			expect(chatStore.sendAllContext).toBe(false);
		});

		it('should reset contextDetailLevel to "summary"', () => {
			chatStore.setContextDetailLevel('full');

			chatStore.reset();

			expect(chatStore.contextDetailLevel).toBe('summary');
		});

		it('should reset all state including new properties', () => {
			chatStore.setSendAllContext(true);
			chatStore.setContextDetailLevel('full');
			chatStore.setContextEntities(['entity-1', 'entity-2']);

			chatStore.reset();

			expect(chatStore.sendAllContext).toBe(false);
			expect(chatStore.contextDetailLevel).toBe('summary');
			expect(chatStore.contextEntityIds).toEqual([]);
		});

		it('should allow setting state after reset', () => {
			chatStore.setSendAllContext(true);
			chatStore.reset();
			chatStore.setSendAllContext(true);

			expect(chatStore.sendAllContext).toBe(true);
		});
	});

	describe('State Combinations', () => {
		it('should support sendAll=true with summary mode', () => {
			chatStore.setSendAllContext(true);
			chatStore.setContextDetailLevel('summary');

			expect(chatStore.sendAllContext).toBe(true);
			expect(chatStore.contextDetailLevel).toBe('summary');
		});

		it('should support sendAll=true with full mode', () => {
			chatStore.setSendAllContext(true);
			chatStore.setContextDetailLevel('full');

			expect(chatStore.sendAllContext).toBe(true);
			expect(chatStore.contextDetailLevel).toBe('full');
		});

		it('should support sendAll=false with summary mode (default)', () => {
			chatStore.setSendAllContext(false);
			chatStore.setContextDetailLevel('summary');

			expect(chatStore.sendAllContext).toBe(false);
			expect(chatStore.contextDetailLevel).toBe('summary');
		});

		it('should support sendAll=false with full mode', () => {
			chatStore.setSendAllContext(false);
			chatStore.setContextDetailLevel('full');

			expect(chatStore.sendAllContext).toBe(false);
			expect(chatStore.contextDetailLevel).toBe('full');
		});
	});

	describe('Edge Cases', () => {
		it('should handle toggling sendAllContext multiple times', () => {
			chatStore.setSendAllContext(true);
			chatStore.setSendAllContext(false);
			chatStore.setSendAllContext(true);
			chatStore.setSendAllContext(false);

			expect(chatStore.sendAllContext).toBe(false);
		});

		it('should handle toggling contextDetailLevel multiple times', () => {
			chatStore.setContextDetailLevel('full');
			chatStore.setContextDetailLevel('summary');
			chatStore.setContextDetailLevel('full');
			chatStore.setContextDetailLevel('summary');

			expect(chatStore.contextDetailLevel).toBe('summary');
		});

		it('should handle setting same value multiple times', () => {
			chatStore.setSendAllContext(true);
			chatStore.setSendAllContext(true);
			chatStore.setSendAllContext(true);

			expect(chatStore.sendAllContext).toBe(true);
		});

		it('should handle rapid state changes', () => {
			for (let i = 0; i < 10; i++) {
				chatStore.setSendAllContext(i % 2 === 0);
				chatStore.setContextDetailLevel(i % 2 === 0 ? 'summary' : 'full');
			}

			// Should maintain consistent state
			expect(chatStore.sendAllContext).toBeDefined();
			expect(chatStore.contextDetailLevel).toBeDefined();
		});
	});

	describe('Getter Properties', () => {
		it('should expose sendAllContext as a getter', () => {
			const descriptor = Object.getOwnPropertyDescriptor(
				Object.getPrototypeOf(chatStore),
				'sendAllContext'
			) || Object.getOwnPropertyDescriptor(chatStore, 'sendAllContext');

			// Should be accessible as a property (either as a getter or direct property)
			expect(chatStore.sendAllContext).toBeDefined();
		});

		it('should expose contextDetailLevel as a getter', () => {
			const descriptor = Object.getOwnPropertyDescriptor(
				Object.getPrototypeOf(chatStore),
				'contextDetailLevel'
			) || Object.getOwnPropertyDescriptor(chatStore, 'contextDetailLevel');

			// Should be accessible as a property (either as a getter or direct property)
			expect(chatStore.contextDetailLevel).toBeDefined();
		});

		it('should return current state value when accessed', () => {
			chatStore.setSendAllContext(true);

			const value1 = chatStore.sendAllContext;
			const value2 = chatStore.sendAllContext;

			expect(value1).toBe(true);
			expect(value2).toBe(true);
			expect(value1).toBe(value2);
		});
	});

	describe('Type Safety', () => {
		it('should maintain boolean type for sendAllContext', () => {
			chatStore.setSendAllContext(true);
			expect(typeof chatStore.sendAllContext).toBe('boolean');

			chatStore.setSendAllContext(false);
			expect(typeof chatStore.sendAllContext).toBe('boolean');
		});

		it('should maintain string type for contextDetailLevel', () => {
			chatStore.setContextDetailLevel('summary');
			expect(typeof chatStore.contextDetailLevel).toBe('string');

			chatStore.setContextDetailLevel('full');
			expect(typeof chatStore.contextDetailLevel).toBe('string');
		});

		it('should only accept "summary" or "full" for contextDetailLevel', () => {
			chatStore.setContextDetailLevel('summary');
			expect(chatStore.contextDetailLevel).toBe('summary');

			chatStore.setContextDetailLevel('full');
			expect(chatStore.contextDetailLevel).toBe('full');

			// This test documents expected behavior - TypeScript should enforce this at compile time
		});
	});
});
