/**
 * Tests for AI Settings Store
 *
 * Issue #122: Add 'AI Off' toggle to disable all AI features
 *
 * These tests verify the AI settings store which controls the global
 * AI enabled/disabled state. They test:
 * - Initialization with/without API key
 * - Persistence to localStorage
 * - State transitions (toggle, setEnabled)
 * - Default behavior
 *
 * These tests are written in the RED phase of TDD - they will FAIL until the
 * aiSettings store is properly implemented.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

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

Object.defineProperty(global, 'localStorage', {
	value: mockLocalStorage,
	writable: true
});

describe('AI Settings Store (Issue #122)', () => {
	let aiSettings: any;

	beforeEach(async () => {
		vi.clearAllMocks();
		mockLocalStorage.clear();

		// Clear module cache to get fresh store instance
		vi.resetModules();

		// Import store after clearing cache
		const module = await import('./aiSettings.svelte');
		aiSettings = module.aiSettings;
	});

	describe('Initialization', () => {
		it('should initialize as disabled when no API key exists', async () => {
			// Remove any API keys
			mockLocalStorage.removeItem('dm-assist-api-key');
			mockLocalStorage.removeItem('ai-provider-anthropic-apikey');
			mockLocalStorage.removeItem('ai-provider-openai-apikey');

			// Reload store
			vi.resetModules();
			const module = await import('./aiSettings.svelte');
			const freshStore = module.aiSettings;

			await freshStore.load();

			expect(freshStore.isEnabled).toBe(false);
		});

		it('should initialize as enabled when API key exists', async () => {
			// Set an API key
			mockLocalStorage.setItem('dm-assist-api-key', 'test-api-key');

			// Reload store
			vi.resetModules();
			const module = await import('./aiSettings.svelte');
			const freshStore = module.aiSettings;

			await freshStore.load();

			expect(freshStore.isEnabled).toBe(true);
		});

		it('should initialize as enabled when Anthropic API key exists', async () => {
			// Set an Anthropic API key
			mockLocalStorage.setItem('ai-provider-anthropic-apikey', 'sk-ant-test');

			// Reload store
			vi.resetModules();
			const module = await import('./aiSettings.svelte');
			const freshStore = module.aiSettings;

			await freshStore.load();

			expect(freshStore.isEnabled).toBe(true);
		});

		it('should initialize as enabled when OpenAI API key exists', async () => {
			// Set an OpenAI API key
			mockLocalStorage.setItem('ai-provider-openai-apikey', 'sk-test');

			// Reload store
			vi.resetModules();
			const module = await import('./aiSettings.svelte');
			const freshStore = module.aiSettings;

			await freshStore.load();

			expect(freshStore.isEnabled).toBe(true);
		});

		it('should initialize as enabled when Google API key exists', async () => {
			// Set a Google API key
			mockLocalStorage.setItem('ai-provider-google-apikey', 'test-google-key');

			// Reload store
			vi.resetModules();
			const module = await import('./aiSettings.svelte');
			const freshStore = module.aiSettings;

			await freshStore.load();

			expect(freshStore.isEnabled).toBe(true);
		});

		it('should respect stored preference over API key presence', async () => {
			// Set an API key but explicitly disable AI
			mockLocalStorage.setItem('dm-assist-api-key', 'test-api-key');
			mockLocalStorage.setItem('dm-assist-ai-enabled', 'false');

			// Reload store
			vi.resetModules();
			const module = await import('./aiSettings.svelte');
			const freshStore = module.aiSettings;

			await freshStore.load();

			expect(freshStore.isEnabled).toBe(false);
		});

		it('should respect stored enabled preference', async () => {
			// No API key, but user has explicitly enabled AI (edge case)
			mockLocalStorage.setItem('dm-assist-ai-enabled', 'true');

			// Reload store
			vi.resetModules();
			const module = await import('./aiSettings.svelte');
			const freshStore = module.aiSettings;

			await freshStore.load();

			// Should be enabled because user explicitly set it
			expect(freshStore.isEnabled).toBe(true);
		});
	});

	describe('setEnabled()', () => {
		beforeEach(async () => {
			await aiSettings.load();
		});

		it('should enable AI features', async () => {
			await aiSettings.setEnabled(true);

			expect(aiSettings.isEnabled).toBe(true);
		});

		it('should disable AI features', async () => {
			await aiSettings.setEnabled(false);

			expect(aiSettings.isEnabled).toBe(false);
		});

		it('should persist enabled state to localStorage', async () => {
			await aiSettings.setEnabled(true);

			expect(mockLocalStorage.getItem('dm-assist-ai-enabled')).toBe('true');
		});

		it('should persist disabled state to localStorage', async () => {
			await aiSettings.setEnabled(false);

			expect(mockLocalStorage.getItem('dm-assist-ai-enabled')).toBe('false');
		});

		it('should update isEnabled immediately', async () => {
			await aiSettings.setEnabled(true);
			expect(aiSettings.isEnabled).toBe(true);

			await aiSettings.setEnabled(false);
			expect(aiSettings.isEnabled).toBe(false);
		});
	});

	describe('toggle()', () => {
		beforeEach(async () => {
			await aiSettings.load();
		});

		it('should toggle from enabled to disabled', async () => {
			await aiSettings.setEnabled(true);

			await aiSettings.toggle();

			expect(aiSettings.isEnabled).toBe(false);
		});

		it('should toggle from disabled to enabled', async () => {
			await aiSettings.setEnabled(false);

			await aiSettings.toggle();

			expect(aiSettings.isEnabled).toBe(true);
		});

		it('should persist toggled state to localStorage', async () => {
			await aiSettings.setEnabled(true);
			await aiSettings.toggle();

			expect(mockLocalStorage.getItem('dm-assist-ai-enabled')).toBe('false');

			await aiSettings.toggle();
			expect(mockLocalStorage.getItem('dm-assist-ai-enabled')).toBe('true');
		});

		it('should handle multiple toggles', async () => {
			await aiSettings.setEnabled(false);

			await aiSettings.toggle(); // true
			expect(aiSettings.isEnabled).toBe(true);

			await aiSettings.toggle(); // false
			expect(aiSettings.isEnabled).toBe(false);

			await aiSettings.toggle(); // true
			expect(aiSettings.isEnabled).toBe(true);
		});
	});

	describe('Persistence', () => {
		it('should load persisted enabled state', async () => {
			mockLocalStorage.setItem('dm-assist-ai-enabled', 'true');

			// Reload store
			vi.resetModules();
			const module = await import('./aiSettings.svelte');
			const freshStore = module.aiSettings;

			await freshStore.load();

			expect(freshStore.isEnabled).toBe(true);
		});

		it('should load persisted disabled state', async () => {
			mockLocalStorage.setItem('dm-assist-ai-enabled', 'false');

			// Reload store
			vi.resetModules();
			const module = await import('./aiSettings.svelte');
			const freshStore = module.aiSettings;

			await freshStore.load();

			expect(freshStore.isEnabled).toBe(false);
		});

		it('should handle corrupted localStorage value', async () => {
			mockLocalStorage.setItem('dm-assist-ai-enabled', 'invalid-boolean');

			// Reload store
			vi.resetModules();
			const module = await import('./aiSettings.svelte');
			const freshStore = module.aiSettings;

			// Should not throw
			expect(async () => await freshStore.load()).not.toThrow();
		});

		it('should handle missing localStorage', async () => {
			// Temporarily remove localStorage
			const originalLocalStorage = global.localStorage;
			delete (global as any).localStorage;

			// Reload store
			vi.resetModules();
			const module = await import('./aiSettings.svelte');
			const freshStore = module.aiSettings;

			// Should not throw and should use safe defaults
			expect(async () => await freshStore.load()).not.toThrow();
			expect(freshStore.isEnabled).toBe(false);

			// Restore localStorage
			global.localStorage = originalLocalStorage;
		});
	});

	describe('Reactive Getters', () => {
		it('should expose aiEnabled state getter', async () => {
			await aiSettings.load();
			await aiSettings.setEnabled(true);

			expect(aiSettings.aiEnabled).toBe(true);
		});

		it('should expose isEnabled derived value', async () => {
			await aiSettings.load();
			await aiSettings.setEnabled(false);

			expect(aiSettings.isEnabled).toBe(false);
		});

		it('should update reactive getters when state changes', async () => {
			await aiSettings.load();

			await aiSettings.setEnabled(true);
			expect(aiSettings.isEnabled).toBe(true);
			expect(aiSettings.aiEnabled).toBe(true);

			await aiSettings.setEnabled(false);
			expect(aiSettings.isEnabled).toBe(false);
			expect(aiSettings.aiEnabled).toBe(false);
		});
	});

	describe('Edge Cases', () => {
		it('should handle rapid toggles', async () => {
			await aiSettings.load();

			// Rapidly toggle multiple times
			await aiSettings.toggle();
			await aiSettings.toggle();
			await aiSettings.toggle();
			await aiSettings.toggle();

			// Final state should be correct
			const expected = false; // Started false, toggled 4 times
			expect(aiSettings.isEnabled).toBe(expected);
		});

		it('should handle setEnabled with same value', async () => {
			await aiSettings.load();
			await aiSettings.setEnabled(true);

			// Set to same value
			await aiSettings.setEnabled(true);

			expect(aiSettings.isEnabled).toBe(true);
			expect(mockLocalStorage.getItem('dm-assist-ai-enabled')).toBe('true');
		});

		it('should handle empty string in localStorage', async () => {
			mockLocalStorage.setItem('dm-assist-ai-enabled', '');

			// Reload store
			vi.resetModules();
			const module = await import('./aiSettings.svelte');
			const freshStore = module.aiSettings;

			await freshStore.load();

			// Should fall back to checking API key
			expect(freshStore.isEnabled).toBe(false);
		});

		it('should handle whitespace in localStorage', async () => {
			mockLocalStorage.setItem('dm-assist-ai-enabled', '  true  ');

			// Reload store
			vi.resetModules();
			const module = await import('./aiSettings.svelte');
			const freshStore = module.aiSettings;

			await freshStore.load();

			// Should handle whitespace gracefully
			expect(freshStore.isEnabled).toBe(true);
		});
	});

	describe('Integration with API Key Detection', () => {
		it('should check legacy API key location', async () => {
			mockLocalStorage.setItem('dm-assist-api-key', 'legacy-key');

			// Reload store
			vi.resetModules();
			const module = await import('./aiSettings.svelte');
			const freshStore = module.aiSettings;

			await freshStore.load();

			expect(freshStore.isEnabled).toBe(true);
		});

		it('should check all provider API key locations', async () => {
			// No keys initially
			expect(aiSettings.isEnabled).toBe(false);

			// Add provider key
			mockLocalStorage.setItem('ai-provider-mistral-apikey', 'mistral-key');

			// Reload store
			vi.resetModules();
			const module = await import('./aiSettings.svelte');
			const freshStore = module.aiSettings;

			await freshStore.load();

			expect(freshStore.isEnabled).toBe(true);
		});

		it('should check Ollama baseUrl', async () => {
			mockLocalStorage.setItem('ai-provider-ollama-baseurl', 'http://localhost:11434');

			// Reload store
			vi.resetModules();
			const module = await import('./aiSettings.svelte');
			const freshStore = module.aiSettings;

			await freshStore.load();

			expect(freshStore.isEnabled).toBe(true);
		});

		it('should prioritize explicit setting over API key detection', async () => {
			mockLocalStorage.setItem('dm-assist-api-key', 'test-key');
			mockLocalStorage.setItem('dm-assist-ai-enabled', 'false');

			// Reload store
			vi.resetModules();
			const module = await import('./aiSettings.svelte');
			const freshStore = module.aiSettings;

			await freshStore.load();

			// User explicitly disabled, so should be disabled even with key
			expect(freshStore.isEnabled).toBe(false);
		});
	});
});
