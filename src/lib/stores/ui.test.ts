/**
 * Tests for UI Store
 *
 * These tests verify the UI state management store which controls:
 * - Sidebar collapse/expand state
 * - Chat panel open/close state
 * - Modal management (open/close by ID)
 * - Entity selection state
 * - Theme management (light/dark/system with localStorage persistence)
 *
 * Test Coverage:
 * - Initial state (all defaults)
 * - Sidebar toggle functionality
 * - Chat panel operations (toggle, open, close)
 * - Modal operations (open by ID, close)
 * - Entity selection (select by ID, clear selection)
 * - Theme management (set, persist, load, apply to DOM)
 * - System theme resolution based on prefers-color-scheme
 * - Browser environment edge cases
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock localStorage
const mockLocalStorage = (() => {
	let store: Record<string, string> = {};
	return {
		getItem: (key: string) => store[key] || null,
		setItem: (key: string, value: string) => {
			store[key] = value;
		},
		removeItem: (key: string) => {
			delete store[key];
		},
		clear: () => {
			store = {};
		}
	};
})();

// Mock matchMedia
const createMockMatchMedia = (matches: boolean) => {
	return (query: string) => ({
		matches,
		media: query,
		onchange: null,
		addListener: vi.fn(),
		removeListener: vi.fn(),
		addEventListener: vi.fn(),
		removeEventListener: vi.fn(),
		dispatchEvent: vi.fn()
	});
};

describe('UI Store', () => {
	let uiStore: any;
	let mockDocument: any;

	beforeEach(async () => {
		vi.clearAllMocks();
		mockLocalStorage.clear();

		// Setup browser environment mocks
		Object.defineProperty(global, 'localStorage', {
			value: mockLocalStorage,
			writable: true,
			configurable: true
		});

		// Mock document with classList
		mockDocument = {
			documentElement: {
				classList: {
					toggle: vi.fn(),
					add: vi.fn(),
					remove: vi.fn()
				}
			}
		};

		Object.defineProperty(global, 'document', {
			value: mockDocument,
			writable: true,
			configurable: true
		});

		// Default matchMedia to light mode
		Object.defineProperty(global, 'window', {
			value: {
				matchMedia: createMockMatchMedia(false)
			},
			writable: true,
			configurable: true
		});

		// Clear module cache and import fresh instance
		vi.resetModules();
		const module = await import('./ui.svelte');
		uiStore = module.uiStore;
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe('Initial State', () => {
		it('should initialize with sidebar not collapsed', () => {
			expect(uiStore.sidebarCollapsed).toBe(false);
		});

		it('should initialize with chat panel closed', () => {
			expect(uiStore.chatPanelOpen).toBe(false);
		});

		it('should initialize with no active modal', () => {
			expect(uiStore.activeModal).toBe(null);
		});

		it('should initialize with no selected entity', () => {
			expect(uiStore.selectedEntityId).toBe(null);
		});

		it('should initialize with system theme', () => {
			expect(uiStore.theme).toBe('system');
		});

		it('should have all state properties defined', () => {
			expect(uiStore).toHaveProperty('sidebarCollapsed');
			expect(uiStore).toHaveProperty('chatPanelOpen');
			expect(uiStore).toHaveProperty('activeModal');
			expect(uiStore).toHaveProperty('selectedEntityId');
			expect(uiStore).toHaveProperty('theme');
			expect(uiStore).toHaveProperty('resolvedTheme');
		});
	});

	describe('Sidebar State', () => {
		it('should toggle sidebar from collapsed to expanded', () => {
			// Start not collapsed
			expect(uiStore.sidebarCollapsed).toBe(false);

			uiStore.toggleSidebar();

			expect(uiStore.sidebarCollapsed).toBe(true);
		});

		it('should toggle sidebar from expanded to collapsed', () => {
			// Toggle to collapsed
			uiStore.toggleSidebar();
			expect(uiStore.sidebarCollapsed).toBe(true);

			// Toggle back to expanded
			uiStore.toggleSidebar();
			expect(uiStore.sidebarCollapsed).toBe(false);
		});

		it('should handle multiple sidebar toggles', () => {
			expect(uiStore.sidebarCollapsed).toBe(false);

			uiStore.toggleSidebar(); // true
			expect(uiStore.sidebarCollapsed).toBe(true);

			uiStore.toggleSidebar(); // false
			expect(uiStore.sidebarCollapsed).toBe(false);

			uiStore.toggleSidebar(); // true
			expect(uiStore.sidebarCollapsed).toBe(true);

			uiStore.toggleSidebar(); // false
			expect(uiStore.sidebarCollapsed).toBe(false);
		});
	});

	describe('Chat Panel State', () => {
		describe('toggleChatPanel()', () => {
			it('should toggle chat panel from closed to open', () => {
				expect(uiStore.chatPanelOpen).toBe(false);

				uiStore.toggleChatPanel();

				expect(uiStore.chatPanelOpen).toBe(true);
			});

			it('should toggle chat panel from open to closed', () => {
				uiStore.toggleChatPanel();
				expect(uiStore.chatPanelOpen).toBe(true);

				uiStore.toggleChatPanel();

				expect(uiStore.chatPanelOpen).toBe(false);
			});

			it('should handle multiple chat panel toggles', () => {
				expect(uiStore.chatPanelOpen).toBe(false);

				uiStore.toggleChatPanel(); // true
				expect(uiStore.chatPanelOpen).toBe(true);

				uiStore.toggleChatPanel(); // false
				expect(uiStore.chatPanelOpen).toBe(false);

				uiStore.toggleChatPanel(); // true
				expect(uiStore.chatPanelOpen).toBe(true);
			});
		});

		describe('openChatPanel()', () => {
			it('should open chat panel when closed', () => {
				expect(uiStore.chatPanelOpen).toBe(false);

				uiStore.openChatPanel();

				expect(uiStore.chatPanelOpen).toBe(true);
			});

			it('should keep chat panel open when already open', () => {
				uiStore.openChatPanel();
				expect(uiStore.chatPanelOpen).toBe(true);

				uiStore.openChatPanel();

				expect(uiStore.chatPanelOpen).toBe(true);
			});

			it('should work multiple times consecutively', () => {
				uiStore.openChatPanel();
				uiStore.openChatPanel();
				uiStore.openChatPanel();

				expect(uiStore.chatPanelOpen).toBe(true);
			});
		});

		describe('closeChatPanel()', () => {
			it('should close chat panel when open', () => {
				uiStore.openChatPanel();
				expect(uiStore.chatPanelOpen).toBe(true);

				uiStore.closeChatPanel();

				expect(uiStore.chatPanelOpen).toBe(false);
			});

			it('should keep chat panel closed when already closed', () => {
				expect(uiStore.chatPanelOpen).toBe(false);

				uiStore.closeChatPanel();

				expect(uiStore.chatPanelOpen).toBe(false);
			});

			it('should work multiple times consecutively', () => {
				uiStore.closeChatPanel();
				uiStore.closeChatPanel();
				uiStore.closeChatPanel();

				expect(uiStore.chatPanelOpen).toBe(false);
			});
		});

		describe('Chat Panel Method Interactions', () => {
			it('should allow toggle after explicit open', () => {
				uiStore.openChatPanel();
				expect(uiStore.chatPanelOpen).toBe(true);

				uiStore.toggleChatPanel();
				expect(uiStore.chatPanelOpen).toBe(false);
			});

			it('should allow toggle after explicit close', () => {
				uiStore.closeChatPanel();
				expect(uiStore.chatPanelOpen).toBe(false);

				uiStore.toggleChatPanel();
				expect(uiStore.chatPanelOpen).toBe(true);
			});

			it('should handle mixed operations correctly', () => {
				uiStore.openChatPanel(); // true
				uiStore.closeChatPanel(); // false
				uiStore.toggleChatPanel(); // true
				uiStore.toggleChatPanel(); // false
				uiStore.openChatPanel(); // true

				expect(uiStore.chatPanelOpen).toBe(true);
			});
		});
	});

	describe('Modal State', () => {
		describe('openModal()', () => {
			it('should open modal with given ID', () => {
				uiStore.openModal('confirm-delete');

				expect(uiStore.activeModal).toBe('confirm-delete');
			});

			it('should update modal ID when opening different modal', () => {
				uiStore.openModal('modal-1');
				expect(uiStore.activeModal).toBe('modal-1');

				uiStore.openModal('modal-2');
				expect(uiStore.activeModal).toBe('modal-2');
			});

			it('should handle empty string modal ID', () => {
				uiStore.openModal('');

				expect(uiStore.activeModal).toBe('');
			});

			it('should handle modal ID with special characters', () => {
				const specialId = 'modal-with-special!@#$%^&*()_+{}[]|\\:;"\'<>,.?/~`';
				uiStore.openModal(specialId);

				expect(uiStore.activeModal).toBe(specialId);
			});

			it('should handle very long modal IDs', () => {
				const longId = 'a'.repeat(1000);
				uiStore.openModal(longId);

				expect(uiStore.activeModal).toBe(longId);
			});

			it('should replace previously opened modal', () => {
				uiStore.openModal('first-modal');
				expect(uiStore.activeModal).toBe('first-modal');

				uiStore.openModal('second-modal');
				expect(uiStore.activeModal).toBe('second-modal');
			});
		});

		describe('closeModal()', () => {
			it('should close active modal', () => {
				uiStore.openModal('test-modal');
				expect(uiStore.activeModal).toBe('test-modal');

				uiStore.closeModal();

				expect(uiStore.activeModal).toBe(null);
			});

			it('should work when no modal is open', () => {
				expect(uiStore.activeModal).toBe(null);

				uiStore.closeModal();

				expect(uiStore.activeModal).toBe(null);
			});

			it('should work multiple times consecutively', () => {
				uiStore.openModal('test-modal');
				uiStore.closeModal();
				uiStore.closeModal();
				uiStore.closeModal();

				expect(uiStore.activeModal).toBe(null);
			});

			it('should allow reopening modal after close', () => {
				uiStore.openModal('test-modal');
				uiStore.closeModal();

				uiStore.openModal('test-modal');

				expect(uiStore.activeModal).toBe('test-modal');
			});
		});

		describe('Modal Workflow', () => {
			it('should handle complete open-close cycle', () => {
				expect(uiStore.activeModal).toBe(null);

				uiStore.openModal('modal-1');
				expect(uiStore.activeModal).toBe('modal-1');

				uiStore.closeModal();
				expect(uiStore.activeModal).toBe(null);
			});

			it('should handle switching between multiple modals', () => {
				uiStore.openModal('modal-1');
				expect(uiStore.activeModal).toBe('modal-1');

				uiStore.openModal('modal-2');
				expect(uiStore.activeModal).toBe('modal-2');

				uiStore.openModal('modal-3');
				expect(uiStore.activeModal).toBe('modal-3');

				uiStore.closeModal();
				expect(uiStore.activeModal).toBe(null);
			});
		});
	});

	describe('Entity Selection State', () => {
		describe('selectEntity()', () => {
			it('should select entity by ID', () => {
				uiStore.selectEntity('entity-123');

				expect(uiStore.selectedEntityId).toBe('entity-123');
			});

			it('should update selection when selecting different entity', () => {
				uiStore.selectEntity('entity-1');
				expect(uiStore.selectedEntityId).toBe('entity-1');

				uiStore.selectEntity('entity-2');
				expect(uiStore.selectedEntityId).toBe('entity-2');
			});

			it('should clear selection when passing null', () => {
				uiStore.selectEntity('entity-123');
				expect(uiStore.selectedEntityId).toBe('entity-123');

				uiStore.selectEntity(null);

				expect(uiStore.selectedEntityId).toBe(null);
			});

			it('should handle empty string entity ID', () => {
				uiStore.selectEntity('');

				expect(uiStore.selectedEntityId).toBe('');
			});

			it('should handle UUID format IDs', () => {
				const uuid = '550e8400-e29b-41d4-a716-446655440000';
				uiStore.selectEntity(uuid);

				expect(uiStore.selectedEntityId).toBe(uuid);
			});

			it('should handle numeric string IDs', () => {
				uiStore.selectEntity('12345');

				expect(uiStore.selectedEntityId).toBe('12345');
			});

			it('should handle very long entity IDs', () => {
				const longId = 'entity-' + 'a'.repeat(500);
				uiStore.selectEntity(longId);

				expect(uiStore.selectedEntityId).toBe(longId);
			});

			it('should allow selecting same entity multiple times', () => {
				uiStore.selectEntity('entity-123');
				uiStore.selectEntity('entity-123');
				uiStore.selectEntity('entity-123');

				expect(uiStore.selectedEntityId).toBe('entity-123');
			});
		});

		describe('Entity Selection Workflow', () => {
			it('should handle complete selection-clear cycle', () => {
				expect(uiStore.selectedEntityId).toBe(null);

				uiStore.selectEntity('entity-1');
				expect(uiStore.selectedEntityId).toBe('entity-1');

				uiStore.selectEntity(null);
				expect(uiStore.selectedEntityId).toBe(null);
			});

			it('should handle switching between multiple entities', () => {
				uiStore.selectEntity('entity-1');
				expect(uiStore.selectedEntityId).toBe('entity-1');

				uiStore.selectEntity('entity-2');
				expect(uiStore.selectedEntityId).toBe('entity-2');

				uiStore.selectEntity('entity-3');
				expect(uiStore.selectedEntityId).toBe('entity-3');

				uiStore.selectEntity(null);
				expect(uiStore.selectedEntityId).toBe(null);
			});

			it('should clear selection using null multiple times', () => {
				uiStore.selectEntity('entity-123');
				uiStore.selectEntity(null);
				uiStore.selectEntity(null);
				uiStore.selectEntity(null);

				expect(uiStore.selectedEntityId).toBe(null);
			});
		});
	});

	describe('Theme Management', () => {
		describe('setTheme()', () => {
			it('should set theme to light', () => {
				uiStore.setTheme('light');

				expect(uiStore.theme).toBe('light');
			});

			it('should set theme to dark', () => {
				uiStore.setTheme('dark');

				expect(uiStore.theme).toBe('dark');
			});

			it('should set theme to system', () => {
				uiStore.setTheme('system');

				expect(uiStore.theme).toBe('system');
			});

			it('should persist light theme to localStorage', () => {
				uiStore.setTheme('light');

				expect(mockLocalStorage.getItem('theme')).toBe('light');
			});

			it('should persist dark theme to localStorage', () => {
				uiStore.setTheme('dark');

				expect(mockLocalStorage.getItem('theme')).toBe('dark');
			});

			it('should persist system theme to localStorage', () => {
				uiStore.setTheme('system');

				expect(mockLocalStorage.getItem('theme')).toBe('system');
			});

			it('should update theme immediately', () => {
				expect(uiStore.theme).toBe('system');

				uiStore.setTheme('dark');
				expect(uiStore.theme).toBe('dark');

				uiStore.setTheme('light');
				expect(uiStore.theme).toBe('light');
			});

			it('should call applyTheme when setting theme', () => {
				const spy = vi.spyOn(uiStore, 'applyTheme');

				uiStore.setTheme('dark');

				expect(spy).toHaveBeenCalled();
			});

			it('should handle setting same theme multiple times', () => {
				uiStore.setTheme('dark');
				uiStore.setTheme('dark');
				uiStore.setTheme('dark');

				expect(uiStore.theme).toBe('dark');
				expect(mockLocalStorage.getItem('theme')).toBe('dark');
			});

			it('should switch between different themes', () => {
				uiStore.setTheme('light');
				expect(uiStore.theme).toBe('light');

				uiStore.setTheme('dark');
				expect(uiStore.theme).toBe('dark');

				uiStore.setTheme('system');
				expect(uiStore.theme).toBe('system');

				uiStore.setTheme('light');
				expect(uiStore.theme).toBe('light');
			});
		});

		describe('loadTheme()', () => {
			it('should load theme from localStorage', () => {
				mockLocalStorage.setItem('theme', 'dark');

				uiStore.loadTheme();

				expect(uiStore.theme).toBe('dark');
			});

			it('should load light theme from localStorage', () => {
				mockLocalStorage.setItem('theme', 'light');

				uiStore.loadTheme();

				expect(uiStore.theme).toBe('light');
			});

			it('should load system theme from localStorage', () => {
				mockLocalStorage.setItem('theme', 'system');

				uiStore.loadTheme();

				expect(uiStore.theme).toBe('system');
			});

			it('should keep default theme when no stored theme exists', () => {
				const initialTheme = uiStore.theme;

				uiStore.loadTheme();

				expect(uiStore.theme).toBe(initialTheme);
			});

			it('should call applyTheme after loading', () => {
				mockLocalStorage.setItem('theme', 'dark');
				const spy = vi.spyOn(uiStore, 'applyTheme');

				uiStore.loadTheme();

				expect(spy).toHaveBeenCalled();
			});

			it('should handle missing localStorage gracefully', () => {
				// Temporarily remove localStorage
				const originalLocalStorage = global.localStorage;
				delete (global as any).localStorage;
				Object.defineProperty(global, 'window', {
					value: undefined,
					writable: true,
					configurable: true
				});

				// Should not throw
				expect(() => {
					uiStore.loadTheme();
				}).not.toThrow();

				// Restore
				global.localStorage = originalLocalStorage;
				Object.defineProperty(global, 'window', {
					value: {
						matchMedia: createMockMatchMedia(false)
					},
					writable: true,
					configurable: true
				});
			});
		});

		describe('applyTheme()', () => {
			it('should apply dark theme to document when theme is dark', () => {
				uiStore.setTheme('dark');

				uiStore.applyTheme();

				expect(mockDocument.documentElement.classList.toggle).toHaveBeenCalledWith('dark', true);
			});

			it('should apply light theme to document when theme is light', () => {
				uiStore.setTheme('light');

				uiStore.applyTheme();

				expect(mockDocument.documentElement.classList.toggle).toHaveBeenCalledWith(
					'dark',
					false
				);
			});

			it('should apply system preference when theme is system (dark)', () => {
				// Mock system dark mode
				Object.defineProperty(global, 'window', {
					value: {
						matchMedia: createMockMatchMedia(true)
					},
					writable: true,
					configurable: true
				});

				uiStore.setTheme('system');

				// Clear previous calls from setTheme
				mockDocument.documentElement.classList.toggle.mockClear();

				uiStore.applyTheme();

				expect(mockDocument.documentElement.classList.toggle).toHaveBeenCalledWith('dark', true);
			});

			it('should apply system preference when theme is system (light)', () => {
				// Mock system light mode
				Object.defineProperty(global, 'window', {
					value: {
						matchMedia: createMockMatchMedia(false)
					},
					writable: true,
					configurable: true
				});

				uiStore.setTheme('system');

				// Clear previous calls from setTheme
				mockDocument.documentElement.classList.toggle.mockClear();

				uiStore.applyTheme();

				expect(mockDocument.documentElement.classList.toggle).toHaveBeenCalledWith(
					'dark',
					false
				);
			});

			it('should handle missing document gracefully', () => {
				// Remove document
				delete (global as any).document;

				// Should not throw
				expect(() => {
					uiStore.applyTheme();
				}).not.toThrow();

				// Restore document
				global.document = mockDocument;
			});

			it('should be called automatically by setTheme', () => {
				mockDocument.documentElement.classList.toggle.mockClear();

				uiStore.setTheme('dark');

				expect(mockDocument.documentElement.classList.toggle).toHaveBeenCalled();
			});

			it('should be called automatically by loadTheme', () => {
				mockLocalStorage.setItem('theme', 'dark');
				mockDocument.documentElement.classList.toggle.mockClear();

				uiStore.loadTheme();

				expect(mockDocument.documentElement.classList.toggle).toHaveBeenCalled();
			});
		});

		describe('resolvedTheme', () => {
			it('should resolve to light when theme is light', () => {
				uiStore.setTheme('light');

				// Access the derived value (it's a function)
				const resolved =
					typeof uiStore.resolvedTheme === 'function'
						? uiStore.resolvedTheme()
						: uiStore.resolvedTheme;

				expect(resolved).toBe('light');
			});

			it('should resolve to dark when theme is dark', () => {
				uiStore.setTheme('dark');

				const resolved =
					typeof uiStore.resolvedTheme === 'function'
						? uiStore.resolvedTheme()
						: uiStore.resolvedTheme;

				expect(resolved).toBe('dark');
			});

			it('should resolve to system preference (dark) when theme is system', () => {
				// Mock system dark mode
				Object.defineProperty(global, 'window', {
					value: {
						matchMedia: createMockMatchMedia(true)
					},
					writable: true,
					configurable: true
				});

				uiStore.setTheme('system');

				const resolved =
					typeof uiStore.resolvedTheme === 'function'
						? uiStore.resolvedTheme()
						: uiStore.resolvedTheme;

				expect(resolved).toBe('dark');
			});

			it('should resolve to system preference (light) when theme is system', () => {
				// Mock system light mode
				Object.defineProperty(global, 'window', {
					value: {
						matchMedia: createMockMatchMedia(false)
					},
					writable: true,
					configurable: true
				});

				uiStore.setTheme('system');

				const resolved =
					typeof uiStore.resolvedTheme === 'function'
						? uiStore.resolvedTheme()
						: uiStore.resolvedTheme;

				expect(resolved).toBe('light');
			});

			it('should default to light when window is unavailable', () => {
				// Remove window
				Object.defineProperty(global, 'window', {
					value: undefined,
					writable: true,
					configurable: true
				});

				uiStore.setTheme('system');

				const resolved =
					typeof uiStore.resolvedTheme === 'function'
						? uiStore.resolvedTheme()
						: uiStore.resolvedTheme;

				expect(resolved).toBe('light');
			});
		});

		describe('Theme Persistence', () => {
			it('should persist theme across store reloads', async () => {
				uiStore.setTheme('dark');
				expect(mockLocalStorage.getItem('theme')).toBe('dark');

				// Reload store
				vi.resetModules();
				const module = await import('./ui.svelte');
				const freshStore = module.uiStore;

				freshStore.loadTheme();

				expect(freshStore.theme).toBe('dark');
			});

			it('should maintain default theme when no stored value exists', async () => {
				mockLocalStorage.clear();

				// Reload store
				vi.resetModules();
				const module = await import('./ui.svelte');
				const freshStore = module.uiStore;

				expect(freshStore.theme).toBe('system');
			});

			it('should overwrite previous theme in localStorage', () => {
				uiStore.setTheme('light');
				expect(mockLocalStorage.getItem('theme')).toBe('light');

				uiStore.setTheme('dark');
				expect(mockLocalStorage.getItem('theme')).toBe('dark');

				uiStore.setTheme('system');
				expect(mockLocalStorage.getItem('theme')).toBe('system');
			});
		});
	});

	describe('State Independence', () => {
		it('should not affect other state when toggling sidebar', () => {
			uiStore.openChatPanel();
			uiStore.openModal('test-modal');
			uiStore.selectEntity('entity-123');
			uiStore.setTheme('dark');

			uiStore.toggleSidebar();

			expect(uiStore.chatPanelOpen).toBe(true);
			expect(uiStore.activeModal).toBe('test-modal');
			expect(uiStore.selectedEntityId).toBe('entity-123');
			expect(uiStore.theme).toBe('dark');
		});

		it('should not affect other state when toggling chat panel', () => {
			uiStore.toggleSidebar();
			uiStore.openModal('test-modal');
			uiStore.selectEntity('entity-123');
			uiStore.setTheme('dark');

			uiStore.toggleChatPanel();

			expect(uiStore.sidebarCollapsed).toBe(true);
			expect(uiStore.activeModal).toBe('test-modal');
			expect(uiStore.selectedEntityId).toBe('entity-123');
			expect(uiStore.theme).toBe('dark');
		});

		it('should not affect other state when opening modal', () => {
			uiStore.toggleSidebar();
			uiStore.openChatPanel();
			uiStore.selectEntity('entity-123');
			uiStore.setTheme('dark');

			uiStore.openModal('test-modal');

			expect(uiStore.sidebarCollapsed).toBe(true);
			expect(uiStore.chatPanelOpen).toBe(true);
			expect(uiStore.selectedEntityId).toBe('entity-123');
			expect(uiStore.theme).toBe('dark');
		});

		it('should not affect other state when selecting entity', () => {
			uiStore.toggleSidebar();
			uiStore.openChatPanel();
			uiStore.openModal('test-modal');
			uiStore.setTheme('dark');

			uiStore.selectEntity('entity-123');

			expect(uiStore.sidebarCollapsed).toBe(true);
			expect(uiStore.chatPanelOpen).toBe(true);
			expect(uiStore.activeModal).toBe('test-modal');
			expect(uiStore.theme).toBe('dark');
		});

		it('should not affect other state when setting theme', () => {
			uiStore.toggleSidebar();
			uiStore.openChatPanel();
			uiStore.openModal('test-modal');
			uiStore.selectEntity('entity-123');

			uiStore.setTheme('dark');

			expect(uiStore.sidebarCollapsed).toBe(true);
			expect(uiStore.chatPanelOpen).toBe(true);
			expect(uiStore.activeModal).toBe('test-modal');
			expect(uiStore.selectedEntityId).toBe('entity-123');
		});
	});

	describe('Edge Cases', () => {
		it('should handle rapid state changes', () => {
			for (let i = 0; i < 10; i++) {
				uiStore.toggleSidebar();
				uiStore.toggleChatPanel();
				uiStore.openModal(`modal-${i}`);
				uiStore.selectEntity(`entity-${i}`);
			}

			// Final state should be consistent
			expect(uiStore.activeModal).toBe('modal-9');
			expect(uiStore.selectedEntityId).toBe('entity-9');
		});

		it('should handle browser environment being unavailable', () => {
			// Remove all browser globals
			const originalWindow = global.window;
			const originalDocument = global.document;
			const originalLocalStorage = global.localStorage;

			delete (global as any).window;
			delete (global as any).document;
			delete (global as any).localStorage;

			// Operations should not throw
			expect(() => {
				uiStore.setTheme('dark');
				uiStore.loadTheme();
				uiStore.applyTheme();
			}).not.toThrow();

			// Restore globals
			global.window = originalWindow;
			global.document = originalDocument;
			global.localStorage = originalLocalStorage;
		});

		it('should handle all state mutations in sequence', () => {
			uiStore.toggleSidebar();
			expect(uiStore.sidebarCollapsed).toBe(true);

			uiStore.openChatPanel();
			expect(uiStore.chatPanelOpen).toBe(true);

			uiStore.openModal('test-modal');
			expect(uiStore.activeModal).toBe('test-modal');

			uiStore.selectEntity('test-entity');
			expect(uiStore.selectedEntityId).toBe('test-entity');

			uiStore.setTheme('dark');
			expect(uiStore.theme).toBe('dark');

			uiStore.toggleSidebar();
			expect(uiStore.sidebarCollapsed).toBe(false);

			uiStore.closeChatPanel();
			expect(uiStore.chatPanelOpen).toBe(false);

			uiStore.closeModal();
			expect(uiStore.activeModal).toBe(null);

			uiStore.selectEntity(null);
			expect(uiStore.selectedEntityId).toBe(null);

			uiStore.setTheme('system');
			expect(uiStore.theme).toBe('system');
		});
	});

	describe('Browser API Integration', () => {
		it('should detect dark mode system preference', () => {
			Object.defineProperty(global, 'window', {
				value: {
					matchMedia: createMockMatchMedia(true)
				},
				writable: true,
				configurable: true
			});

			uiStore.setTheme('system');

			const resolved =
				typeof uiStore.resolvedTheme === 'function'
					? uiStore.resolvedTheme()
					: uiStore.resolvedTheme;

			expect(resolved).toBe('dark');
		});

		it('should detect light mode system preference', () => {
			Object.defineProperty(global, 'window', {
				value: {
					matchMedia: createMockMatchMedia(false)
				},
				writable: true,
				configurable: true
			});

			uiStore.setTheme('system');

			const resolved =
				typeof uiStore.resolvedTheme === 'function'
					? uiStore.resolvedTheme()
					: uiStore.resolvedTheme;

			expect(resolved).toBe('light');
		});

		it('should use matchMedia with correct query', () => {
			const matchMediaSpy = vi.fn(createMockMatchMedia(false));
			Object.defineProperty(global, 'window', {
				value: {
					matchMedia: matchMediaSpy
				},
				writable: true,
				configurable: true
			});

			uiStore.setTheme('system');
			// Trigger the derived computation by accessing it
			const resolved =
				typeof uiStore.resolvedTheme === 'function'
					? uiStore.resolvedTheme()
					: uiStore.resolvedTheme;

			expect(matchMediaSpy).toHaveBeenCalledWith('(prefers-color-scheme: dark)');
		});

		it('should interact with localStorage correctly', () => {
			const setItemSpy = vi.spyOn(mockLocalStorage, 'setItem');
			const getItemSpy = vi.spyOn(mockLocalStorage, 'getItem');

			uiStore.setTheme('dark');
			expect(setItemSpy).toHaveBeenCalledWith('theme', 'dark');

			mockLocalStorage.setItem('theme', 'light');
			uiStore.loadTheme();
			expect(getItemSpy).toHaveBeenCalledWith('theme');
		});

		it('should manipulate document classList correctly', () => {
			const toggleSpy = mockDocument.documentElement.classList.toggle;

			uiStore.setTheme('dark');
			expect(toggleSpy).toHaveBeenCalledWith('dark', true);

			toggleSpy.mockClear();
			uiStore.setTheme('light');
			expect(toggleSpy).toHaveBeenCalledWith('dark', false);
		});
	});
});
