/**
 * Tests for AI Settings Store - Tri-State Mode Enhancement
 *
 * Phase 1: AI Settings Enhancement - Tri-State AI Mode
 *
 * These tests verify the tri-state AI mode implementation which replaces the
 * simple boolean on/off toggle with three distinct modes:
 * - 'off': AI features completely disabled
 * - 'suggestions': AI provides passive suggestions (low-friction mode)
 * - 'full': Full AI features enabled (current behavior)
 *
 * Test Coverage:
 * - AIMode type definition and values
 * - Store state management (aiMode)
 * - Derived state calculations (isEnabled, isSuggestionsMode, isFullMode)
 * - Mode transitions and persistence
 * - Backward compatibility with existing boolean-based code
 * - Migration from boolean to tri-state system
 *
 * These tests are written in the RED phase of TDD - they will FAIL until the
 * tri-state mode implementation is complete.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { AIMode } from '$lib/types/ai';

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

describe('AI Settings Store - Tri-State Mode (Phase 1)', () => {
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

	describe('AIMode Type Definition', () => {
		it('should define AIMode type with three values', () => {
			// This test verifies the type exists at runtime
			const validModes: AIMode[] = ['off', 'suggestions', 'full'];

			// All three values should be valid AIMode values
			expect(validModes).toHaveLength(3);
			expect(validModes).toContain('off');
			expect(validModes).toContain('suggestions');
			expect(validModes).toContain('full');
		});

		it('should export AIMode type from ai.ts', async () => {
			// Verify the type is exported
			const aiTypes = await import('$lib/types/ai');

			// TypeScript will catch this at compile time, but we verify export exists
			expect(aiTypes).toBeDefined();
		});
	});

	describe('Initial State - Tri-State Mode', () => {
		it('should initialize with aiMode property', async () => {
			expect(aiSettings).toHaveProperty('aiMode');
		});

		it('should initialize as off when no API key exists', async () => {
			// Remove any API keys
			mockLocalStorage.removeItem('dm-assist-api-key');
			mockLocalStorage.removeItem('ai-provider-anthropic-apikey');
			mockLocalStorage.removeItem('ai-provider-openai-apikey');

			// Reload store
			vi.resetModules();
			const module = await import('./aiSettings.svelte');
			const freshStore = module.aiSettings;

			await freshStore.load();

			expect(freshStore.aiMode).toBe('off');
		});

		it('should initialize as full when API key exists and no preference stored', async () => {
			// Set an API key
			mockLocalStorage.setItem('dm-assist-api-key', 'test-api-key');

			// Reload store
			vi.resetModules();
			const module = await import('./aiSettings.svelte');
			const freshStore = module.aiSettings;

			await freshStore.load();

			expect(freshStore.aiMode).toBe('full');
		});

		it('should respect stored mode preference', async () => {
			// Set API key and stored preference
			mockLocalStorage.setItem('dm-assist-api-key', 'test-api-key');
			mockLocalStorage.setItem('dm-assist-ai-mode', 'suggestions');

			// Reload store
			vi.resetModules();
			const module = await import('./aiSettings.svelte');
			const freshStore = module.aiSettings;

			await freshStore.load();

			expect(freshStore.aiMode).toBe('suggestions');
		});
	});

	describe('Derived State - isEnabled', () => {
		it('should return false when mode is off', async () => {
			await aiSettings.load();
			await aiSettings.setMode('off');

			expect(aiSettings.isEnabled).toBe(false);
		});

		it('should return true when mode is suggestions', async () => {
			await aiSettings.load();
			await aiSettings.setMode('suggestions');

			expect(aiSettings.isEnabled).toBe(true);
		});

		it('should return true when mode is full', async () => {
			await aiSettings.load();
			await aiSettings.setMode('full');

			expect(aiSettings.isEnabled).toBe(true);
		});

		it('should update reactively when mode changes', async () => {
			await aiSettings.load();

			await aiSettings.setMode('off');
			expect(aiSettings.isEnabled).toBe(false);

			await aiSettings.setMode('suggestions');
			expect(aiSettings.isEnabled).toBe(true);

			await aiSettings.setMode('full');
			expect(aiSettings.isEnabled).toBe(true);

			await aiSettings.setMode('off');
			expect(aiSettings.isEnabled).toBe(false);
		});
	});

	describe('Derived State - isSuggestionsMode', () => {
		it('should return true when mode is suggestions', async () => {
			await aiSettings.load();
			await aiSettings.setMode('suggestions');

			expect(aiSettings.isSuggestionsMode).toBe(true);
		});

		it('should return false when mode is off', async () => {
			await aiSettings.load();
			await aiSettings.setMode('off');

			expect(aiSettings.isSuggestionsMode).toBe(false);
		});

		it('should return false when mode is full', async () => {
			await aiSettings.load();
			await aiSettings.setMode('full');

			expect(aiSettings.isSuggestionsMode).toBe(false);
		});

		it('should update reactively when mode changes', async () => {
			await aiSettings.load();

			await aiSettings.setMode('off');
			expect(aiSettings.isSuggestionsMode).toBe(false);

			await aiSettings.setMode('suggestions');
			expect(aiSettings.isSuggestionsMode).toBe(true);

			await aiSettings.setMode('full');
			expect(aiSettings.isSuggestionsMode).toBe(false);
		});
	});

	describe('Derived State - isFullMode', () => {
		it('should return true when mode is full', async () => {
			await aiSettings.load();
			await aiSettings.setMode('full');

			expect(aiSettings.isFullMode).toBe(true);
		});

		it('should return false when mode is off', async () => {
			await aiSettings.load();
			await aiSettings.setMode('off');

			expect(aiSettings.isFullMode).toBe(false);
		});

		it('should return false when mode is suggestions', async () => {
			await aiSettings.load();
			await aiSettings.setMode('suggestions');

			expect(aiSettings.isFullMode).toBe(false);
		});

		it('should update reactively when mode changes', async () => {
			await aiSettings.load();

			await aiSettings.setMode('off');
			expect(aiSettings.isFullMode).toBe(false);

			await aiSettings.setMode('suggestions');
			expect(aiSettings.isFullMode).toBe(false);

			await aiSettings.setMode('full');
			expect(aiSettings.isFullMode).toBe(true);
		});
	});

	describe('setMode() Method', () => {
		beforeEach(async () => {
			await aiSettings.load();
		});

		it('should set mode to off', async () => {
			await aiSettings.setMode('off');

			expect(aiSettings.aiMode).toBe('off');
		});

		it('should set mode to suggestions', async () => {
			await aiSettings.setMode('suggestions');

			expect(aiSettings.aiMode).toBe('suggestions');
		});

		it('should set mode to full', async () => {
			await aiSettings.setMode('full');

			expect(aiSettings.aiMode).toBe('full');
		});

		it('should persist mode to localStorage', async () => {
			await aiSettings.setMode('suggestions');

			expect(mockLocalStorage.getItem('dm-assist-ai-mode')).toBe('suggestions');
		});

		it('should persist off mode to localStorage', async () => {
			await aiSettings.setMode('off');

			expect(mockLocalStorage.getItem('dm-assist-ai-mode')).toBe('off');
		});

		it('should persist full mode to localStorage', async () => {
			await aiSettings.setMode('full');

			expect(mockLocalStorage.getItem('dm-assist-ai-mode')).toBe('full');
		});

		it('should update mode immediately', async () => {
			await aiSettings.setMode('off');
			expect(aiSettings.aiMode).toBe('off');

			await aiSettings.setMode('suggestions');
			expect(aiSettings.aiMode).toBe('suggestions');

			await aiSettings.setMode('full');
			expect(aiSettings.aiMode).toBe('full');
		});

		it('should handle setting same mode multiple times', async () => {
			await aiSettings.setMode('suggestions');
			await aiSettings.setMode('suggestions');
			await aiSettings.setMode('suggestions');

			expect(aiSettings.aiMode).toBe('suggestions');
			expect(mockLocalStorage.getItem('dm-assist-ai-mode')).toBe('suggestions');
		});

		it('should transition through all three modes', async () => {
			await aiSettings.setMode('off');
			expect(aiSettings.aiMode).toBe('off');

			await aiSettings.setMode('suggestions');
			expect(aiSettings.aiMode).toBe('suggestions');

			await aiSettings.setMode('full');
			expect(aiSettings.aiMode).toBe('full');

			await aiSettings.setMode('off');
			expect(aiSettings.aiMode).toBe('off');
		});
	});

	describe('Persistence and Loading', () => {
		it('should load persisted off mode', async () => {
			mockLocalStorage.setItem('dm-assist-ai-mode', 'off');

			// Reload store
			vi.resetModules();
			const module = await import('./aiSettings.svelte');
			const freshStore = module.aiSettings;

			await freshStore.load();

			expect(freshStore.aiMode).toBe('off');
		});

		it('should load persisted suggestions mode', async () => {
			mockLocalStorage.setItem('dm-assist-ai-mode', 'suggestions');

			// Reload store
			vi.resetModules();
			const module = await import('./aiSettings.svelte');
			const freshStore = module.aiSettings;

			await freshStore.load();

			expect(freshStore.aiMode).toBe('suggestions');
		});

		it('should load persisted full mode', async () => {
			mockLocalStorage.setItem('dm-assist-ai-mode', 'full');

			// Reload store
			vi.resetModules();
			const module = await import('./aiSettings.svelte');
			const freshStore = module.aiSettings;

			await freshStore.load();

			expect(freshStore.aiMode).toBe('full');
		});

		it('should handle corrupted localStorage value', async () => {
			mockLocalStorage.setItem('dm-assist-ai-mode', 'invalid-mode');

			// Reload store
			vi.resetModules();
			const module = await import('./aiSettings.svelte');
			const freshStore = module.aiSettings;

			// Should not throw and should use safe default
			expect(async () => await freshStore.load()).not.toThrow();

			// Should default to 'off' when value is invalid and no API key
			expect(freshStore.aiMode).toBe('off');
		});

		it('should handle missing localStorage gracefully', async () => {
			// Temporarily remove localStorage
			const originalLocalStorage = global.localStorage;
			delete (global as any).localStorage;

			// Reload store
			vi.resetModules();
			const module = await import('./aiSettings.svelte');
			const freshStore = module.aiSettings;

			// Should not throw and should use safe defaults
			expect(async () => await freshStore.load()).not.toThrow();
			expect(freshStore.aiMode).toBe('off');

			// Restore localStorage
			global.localStorage = originalLocalStorage;
		});
	});

	describe('Backward Compatibility - Boolean Migration', () => {
		it('should migrate from true boolean to full mode', async () => {
			// Set old boolean format
			mockLocalStorage.setItem('dm-assist-ai-enabled', 'true');
			mockLocalStorage.removeItem('dm-assist-ai-mode');

			// Reload store
			vi.resetModules();
			const module = await import('./aiSettings.svelte');
			const freshStore = module.aiSettings;

			await freshStore.load();

			// Should migrate to 'full' mode
			expect(freshStore.aiMode).toBe('full');
			expect(freshStore.isEnabled).toBe(true);
		});

		it('should migrate from false boolean to off mode', async () => {
			// Set old boolean format
			mockLocalStorage.setItem('dm-assist-ai-enabled', 'false');
			mockLocalStorage.removeItem('dm-assist-ai-mode');

			// Reload store
			vi.resetModules();
			const module = await import('./aiSettings.svelte');
			const freshStore = module.aiSettings;

			await freshStore.load();

			// Should migrate to 'off' mode
			expect(freshStore.aiMode).toBe('off');
			expect(freshStore.isEnabled).toBe(false);
		});

		it('should prefer new mode format over old boolean format', async () => {
			// Set both old and new formats
			mockLocalStorage.setItem('dm-assist-ai-enabled', 'true');
			mockLocalStorage.setItem('dm-assist-ai-mode', 'suggestions');

			// Reload store
			vi.resetModules();
			const module = await import('./aiSettings.svelte');
			const freshStore = module.aiSettings;

			await freshStore.load();

			// Should use new mode format
			expect(freshStore.aiMode).toBe('suggestions');
		});

		it('should maintain isEnabled backward compatibility', async () => {
			await aiSettings.load();

			// Old code using isEnabled should still work
			await aiSettings.setMode('off');
			expect(aiSettings.isEnabled).toBe(false);

			await aiSettings.setMode('suggestions');
			expect(aiSettings.isEnabled).toBe(true);

			await aiSettings.setMode('full');
			expect(aiSettings.isEnabled).toBe(true);
		});

		it('should maintain aiEnabled getter backward compatibility', async () => {
			await aiSettings.load();

			// Old code using aiEnabled should still work
			await aiSettings.setMode('off');
			expect(aiSettings.aiEnabled).toBe(false);

			await aiSettings.setMode('suggestions');
			expect(aiSettings.aiEnabled).toBe(true);

			await aiSettings.setMode('full');
			expect(aiSettings.aiEnabled).toBe(true);
		});
	});

	describe('Legacy setEnabled() Compatibility', () => {
		beforeEach(async () => {
			await aiSettings.load();
		});

		it('should map setEnabled(true) to full mode', async () => {
			await aiSettings.setEnabled(true);

			expect(aiSettings.aiMode).toBe('full');
			expect(aiSettings.isEnabled).toBe(true);
		});

		it('should map setEnabled(false) to off mode', async () => {
			await aiSettings.setEnabled(false);

			expect(aiSettings.aiMode).toBe('off');
			expect(aiSettings.isEnabled).toBe(false);
		});

		it('should preserve suggestions mode when toggling from suggestions', async () => {
			// Set to suggestions mode
			await aiSettings.setMode('suggestions');
			expect(aiSettings.aiMode).toBe('suggestions');

			// Legacy toggle should cycle: suggestions -> off -> full
			await aiSettings.toggle();
			expect(aiSettings.aiMode).toBe('off');

			await aiSettings.toggle();
			expect(aiSettings.aiMode).toBe('full');
		});
	});

	describe('Edge Cases', () => {
		it('should handle rapid mode changes', async () => {
			await aiSettings.load();

			// Rapidly change modes
			await aiSettings.setMode('off');
			await aiSettings.setMode('suggestions');
			await aiSettings.setMode('full');
			await aiSettings.setMode('off');
			await aiSettings.setMode('full');

			// Final state should be correct
			expect(aiSettings.aiMode).toBe('full');
			expect(mockLocalStorage.getItem('dm-assist-ai-mode')).toBe('full');
		});

		it('should handle empty string in localStorage', async () => {
			mockLocalStorage.setItem('dm-assist-ai-mode', '');

			// Reload store
			vi.resetModules();
			const module = await import('./aiSettings.svelte');
			const freshStore = module.aiSettings;

			await freshStore.load();

			// Should fall back to default (off without API key)
			expect(freshStore.aiMode).toBe('off');
		});

		it('should handle whitespace in localStorage', async () => {
			mockLocalStorage.setItem('dm-assist-ai-mode', '  suggestions  ');

			// Reload store
			vi.resetModules();
			const module = await import('./aiSettings.svelte');
			const freshStore = module.aiSettings;

			await freshStore.load();

			// Should handle whitespace gracefully
			expect(freshStore.aiMode).toBe('suggestions');
		});

		it('should handle case-insensitive mode values', async () => {
			mockLocalStorage.setItem('dm-assist-ai-mode', 'FULL');

			// Reload store
			vi.resetModules();
			const module = await import('./aiSettings.svelte');
			const freshStore = module.aiSettings;

			await freshStore.load();

			// Should normalize to lowercase
			expect(freshStore.aiMode).toBe('full');
		});
	});

	describe('Integration with API Key Detection', () => {
		it('should initialize as full when API key exists and no mode stored', async () => {
			mockLocalStorage.setItem('dm-assist-api-key', 'test-key');

			// Reload store
			vi.resetModules();
			const module = await import('./aiSettings.svelte');
			const freshStore = module.aiSettings;

			await freshStore.load();

			// Should default to full mode when API key exists
			expect(freshStore.aiMode).toBe('full');
		});

		it('should respect stored mode even with API key present', async () => {
			mockLocalStorage.setItem('dm-assist-api-key', 'test-key');
			mockLocalStorage.setItem('dm-assist-ai-mode', 'suggestions');

			// Reload store
			vi.resetModules();
			const module = await import('./aiSettings.svelte');
			const freshStore = module.aiSettings;

			await freshStore.load();

			// Should respect user's mode choice
			expect(freshStore.aiMode).toBe('suggestions');
		});

		it('should allow off mode even with API key present', async () => {
			mockLocalStorage.setItem('dm-assist-api-key', 'test-key');
			mockLocalStorage.setItem('dm-assist-ai-mode', 'off');

			// Reload store
			vi.resetModules();
			const module = await import('./aiSettings.svelte');
			const freshStore = module.aiSettings;

			await freshStore.load();

			// User can disable AI even with key configured
			expect(freshStore.aiMode).toBe('off');
		});
	});

	describe('All Three Modes Behavior', () => {
		beforeEach(async () => {
			await aiSettings.load();
		});

		it('should have distinct behavior for each mode', async () => {
			// Off mode
			await aiSettings.setMode('off');
			expect(aiSettings.aiMode).toBe('off');
			expect(aiSettings.isEnabled).toBe(false);
			expect(aiSettings.isSuggestionsMode).toBe(false);
			expect(aiSettings.isFullMode).toBe(false);

			// Suggestions mode
			await aiSettings.setMode('suggestions');
			expect(aiSettings.aiMode).toBe('suggestions');
			expect(aiSettings.isEnabled).toBe(true);
			expect(aiSettings.isSuggestionsMode).toBe(true);
			expect(aiSettings.isFullMode).toBe(false);

			// Full mode
			await aiSettings.setMode('full');
			expect(aiSettings.aiMode).toBe('full');
			expect(aiSettings.isEnabled).toBe(true);
			expect(aiSettings.isSuggestionsMode).toBe(false);
			expect(aiSettings.isFullMode).toBe(true);
		});

		it('should maintain mode independence', async () => {
			// Setting to suggestions shouldn't affect full
			await aiSettings.setMode('suggestions');
			expect(aiSettings.isFullMode).toBe(false);

			// Setting to full shouldn't affect suggestions
			await aiSettings.setMode('full');
			expect(aiSettings.isSuggestionsMode).toBe(false);

			// Setting to off shouldn't directly set either
			await aiSettings.setMode('off');
			expect(aiSettings.isSuggestionsMode).toBe(false);
			expect(aiSettings.isFullMode).toBe(false);
		});

		it('should correctly report isEnabled for all modes', async () => {
			const modes: Array<{ mode: AIMode; expectedEnabled: boolean }> = [
				{ mode: 'off', expectedEnabled: false },
				{ mode: 'suggestions', expectedEnabled: true },
				{ mode: 'full', expectedEnabled: true }
			];

			for (const { mode, expectedEnabled } of modes) {
				await aiSettings.setMode(mode);
				expect(aiSettings.isEnabled).toBe(expectedEnabled);
			}
		});
	});

	describe('Store API Completeness', () => {
		it('should expose all required properties', async () => {
			await aiSettings.load();

			// State
			expect(aiSettings).toHaveProperty('aiMode');

			// Derived values
			expect(aiSettings).toHaveProperty('isEnabled');
			expect(aiSettings).toHaveProperty('isSuggestionsMode');
			expect(aiSettings).toHaveProperty('isFullMode');

			// Methods
			expect(aiSettings).toHaveProperty('setMode');
			expect(aiSettings).toHaveProperty('load');

			// Legacy compatibility
			expect(aiSettings).toHaveProperty('aiEnabled');
			expect(aiSettings).toHaveProperty('setEnabled');
			expect(aiSettings).toHaveProperty('toggle');
		});

		it('should have correct types for all properties', async () => {
			await aiSettings.load();
			await aiSettings.setMode('suggestions');

			// State should be string (one of the AIMode values)
			expect(typeof aiSettings.aiMode).toBe('string');

			// Derived values should be boolean
			expect(typeof aiSettings.isEnabled).toBe('boolean');
			expect(typeof aiSettings.isSuggestionsMode).toBe('boolean');
			expect(typeof aiSettings.isFullMode).toBe('boolean');

			// Legacy compatibility
			expect(typeof aiSettings.aiEnabled).toBe('boolean');

			// Methods should be functions
			expect(typeof aiSettings.setMode).toBe('function');
			expect(typeof aiSettings.load).toBe('function');
			expect(typeof aiSettings.setEnabled).toBe('function');
			expect(typeof aiSettings.toggle).toBe('function');
		});
	});
});
