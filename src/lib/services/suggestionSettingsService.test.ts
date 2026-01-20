/**
 * Tests for Suggestion Settings Service (TDD RED Phase)
 *
 * Phase B4 of Issue #43: AI Suggestions System
 *
 * This service manages settings for the AI Suggestions system:
 * - enableAutoAnalysis: boolean (default true)
 * - analysisFrequencyHours: number (default 24)
 * - minRelevanceScore: number (default 30)
 * - enabledSuggestionTypes: string[] (all types enabled by default)
 * - maxSuggestionsPerType: number (default 10)
 *
 * Methods:
 * - getSettings(): Promise<SuggestionSettings>
 * - updateSettings(partial): Promise<SuggestionSettings>
 * - resetToDefaults(): Promise<SuggestionSettings>
 *
 * NOTE: These tests are expected to FAIL initially (RED phase).
 * Implementation will be added in the GREEN phase to make them pass.
 */
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
	getSettings,
	updateSettings,
	resetToDefaults,
	DEFAULT_SUGGESTION_SETTINGS,
	type SuggestionSettings
} from './suggestionSettingsService';

describe('suggestionSettingsService', () => {
	// Store original localStorage to restore after tests
	let originalLocalStorage: Storage;
	let store: Record<string, string>;

	beforeEach(() => {
		// Mock localStorage
		originalLocalStorage = global.localStorage;
		store = {};

		global.localStorage = {
			getItem: vi.fn((key: string) => store[key] ?? null),
			setItem: vi.fn((key: string, value: string) => {
				store[key] = value;
			}),
			removeItem: vi.fn((key: string) => {
				delete store[key];
			}),
			clear: vi.fn(() => {
				Object.keys(store).forEach((key) => delete store[key]);
			}),
			length: 0,
			key: vi.fn()
		} as Storage;
	});

	afterEach(() => {
		global.localStorage = originalLocalStorage;
		vi.clearAllMocks();
	});

	describe('DEFAULT_SUGGESTION_SETTINGS', () => {
		it('should have enableAutoAnalysis=true as default', () => {
			expect(DEFAULT_SUGGESTION_SETTINGS.enableAutoAnalysis).toBe(true);
		});

		it('should have analysisFrequencyHours=24 as default', () => {
			expect(DEFAULT_SUGGESTION_SETTINGS.analysisFrequencyHours).toBe(24);
		});

		it('should have minRelevanceScore=30 as default', () => {
			expect(DEFAULT_SUGGESTION_SETTINGS.minRelevanceScore).toBe(30);
		});

		it('should have maxSuggestionsPerType=10 as default', () => {
			expect(DEFAULT_SUGGESTION_SETTINGS.maxSuggestionsPerType).toBe(10);
		});

		it('should have all suggestion types enabled by default', () => {
			const expectedTypes = ['relationship', 'plot_thread', 'inconsistency', 'enhancement', 'recommendation'];
			expect(DEFAULT_SUGGESTION_SETTINGS.enabledSuggestionTypes).toEqual(expectedTypes);
		});

		it('should define all required interface properties', () => {
			expect(DEFAULT_SUGGESTION_SETTINGS).toHaveProperty('enableAutoAnalysis');
			expect(DEFAULT_SUGGESTION_SETTINGS).toHaveProperty('analysisFrequencyHours');
			expect(DEFAULT_SUGGESTION_SETTINGS).toHaveProperty('minRelevanceScore');
			expect(DEFAULT_SUGGESTION_SETTINGS).toHaveProperty('enabledSuggestionTypes');
			expect(DEFAULT_SUGGESTION_SETTINGS).toHaveProperty('maxSuggestionsPerType');
		});
	});

	describe('getSettings', () => {
		describe('Default Values', () => {
			it('should return defaults when no settings stored', async () => {
				const settings = await getSettings();

				expect(settings).toEqual(DEFAULT_SUGGESTION_SETTINGS);
			});

			it('should return defaults when localStorage is empty', async () => {
				store['ai-suggestion-settings'] = '';

				const settings = await getSettings();

				expect(settings).toEqual(DEFAULT_SUGGESTION_SETTINGS);
			});

			it('should return defaults when stored value is null', async () => {
				store['ai-suggestion-settings'] = null as any;

				const settings = await getSettings();

				expect(settings).toEqual(DEFAULT_SUGGESTION_SETTINGS);
			});

			it('should return defaults when localStorage key does not exist', async () => {
				delete store['ai-suggestion-settings'];

				const settings = await getSettings();

				expect(settings.enableAutoAnalysis).toBe(true);
				expect(settings.analysisFrequencyHours).toBe(24);
				expect(settings.minRelevanceScore).toBe(30);
				expect(settings.maxSuggestionsPerType).toBe(10);
				expect(settings.enabledSuggestionTypes).toHaveLength(5);
			});
		});

		describe('Stored Settings Retrieval', () => {
			it('should return stored settings when they exist', async () => {
				const customSettings: SuggestionSettings = {
					enableAutoAnalysis: false,
					analysisFrequencyHours: 48,
					minRelevanceScore: 50,
					enabledSuggestionTypes: ['relationship', 'plot_thread'],
					maxSuggestionsPerType: 20
				};

				store['ai-suggestion-settings'] = JSON.stringify(customSettings);

				const settings = await getSettings();

				expect(settings).toEqual(customSettings);
			});

			it('should merge partial stored settings with defaults', async () => {
				const partialSettings = {
					enableAutoAnalysis: false,
					minRelevanceScore: 60
					// Missing other properties
				};

				store['ai-suggestion-settings'] = JSON.stringify(partialSettings);

				const settings = await getSettings();

				expect(settings.enableAutoAnalysis).toBe(false);
				expect(settings.minRelevanceScore).toBe(60);
				expect(settings.analysisFrequencyHours).toBe(24); // Default
				expect(settings.maxSuggestionsPerType).toBe(10); // Default
				expect(settings.enabledSuggestionTypes).toHaveLength(5); // Default
			});

			it('should handle missing enabledSuggestionTypes gracefully', async () => {
				const settingsWithoutTypes = {
					enableAutoAnalysis: true,
					analysisFrequencyHours: 12,
					minRelevanceScore: 40,
					maxSuggestionsPerType: 15
					// Missing enabledSuggestionTypes
				};

				store['ai-suggestion-settings'] = JSON.stringify(settingsWithoutTypes);

				const settings = await getSettings();

				expect(settings.enabledSuggestionTypes).toEqual(DEFAULT_SUGGESTION_SETTINGS.enabledSuggestionTypes);
			});

			it('should preserve custom enabled types array', async () => {
				const customSettings: SuggestionSettings = {
					enableAutoAnalysis: true,
					analysisFrequencyHours: 24,
					minRelevanceScore: 30,
					enabledSuggestionTypes: ['relationship', 'inconsistency'], // Only 2 types
					maxSuggestionsPerType: 10
				};

				store['ai-suggestion-settings'] = JSON.stringify(customSettings);

				const settings = await getSettings();

				expect(settings.enabledSuggestionTypes).toEqual(['relationship', 'inconsistency']);
				expect(settings.enabledSuggestionTypes).toHaveLength(2);
			});
		});

		describe('Error Handling', () => {
			it('should handle invalid JSON gracefully', async () => {
				store['ai-suggestion-settings'] = 'invalid-json{]';

				const settings = await getSettings();

				expect(settings).toEqual(DEFAULT_SUGGESTION_SETTINGS);
			});

			it('should handle corrupted partial JSON', async () => {
				store['ai-suggestion-settings'] = '{"enableAutoAnalysis": true,';

				const settings = await getSettings();

				expect(settings).toEqual(DEFAULT_SUGGESTION_SETTINGS);
			});

			it('should handle non-object JSON', async () => {
				store['ai-suggestion-settings'] = '"string value"';

				const settings = await getSettings();

				expect(settings).toEqual(DEFAULT_SUGGESTION_SETTINGS);
			});

			it('should handle array JSON', async () => {
				store['ai-suggestion-settings'] = '[1, 2, 3]';

				const settings = await getSettings();

				expect(settings).toEqual(DEFAULT_SUGGESTION_SETTINGS);
			});
		});

		describe('SSR Context Handling', () => {
			it('should return defaults in SSR context (window undefined)', async () => {
				const originalWindow = global.window;
				// @ts-expect-error - Testing SSR behavior
				delete global.window;

				const settings = await getSettings();

				expect(settings).toEqual(DEFAULT_SUGGESTION_SETTINGS);

				// Restore window
				global.window = originalWindow;
			});

			it('should not access localStorage in SSR context', async () => {
				const originalWindow = global.window;
				// @ts-expect-error - Testing SSR behavior
				delete global.window;

				// Should not throw even though localStorage is unavailable
				await expect(getSettings()).resolves.toBeDefined();

				// Restore window
				global.window = originalWindow;
			});
		});
	});

	describe('updateSettings', () => {
		describe('Partial Updates', () => {
			it('should update single setting and preserve others', async () => {
				// Start with defaults
				const original = await getSettings();
				expect(original.enableAutoAnalysis).toBe(true);

				// Update only one field
				const updated = await updateSettings({ enableAutoAnalysis: false });

				expect(updated.enableAutoAnalysis).toBe(false);
				expect(updated.analysisFrequencyHours).toBe(24); // Unchanged
				expect(updated.minRelevanceScore).toBe(30); // Unchanged
			});

			it('should update multiple settings at once', async () => {
				const updates = {
					enableAutoAnalysis: false,
					analysisFrequencyHours: 12,
					minRelevanceScore: 70
				};

				const updated = await updateSettings(updates);

				expect(updated.enableAutoAnalysis).toBe(false);
				expect(updated.analysisFrequencyHours).toBe(12);
				expect(updated.minRelevanceScore).toBe(70);
				expect(updated.maxSuggestionsPerType).toBe(10); // Default unchanged
			});

			it('should update enabledSuggestionTypes array', async () => {
				const updated = await updateSettings({
					enabledSuggestionTypes: ['relationship', 'plot_thread']
				});

				expect(updated.enabledSuggestionTypes).toEqual(['relationship', 'plot_thread']);
			});

			it('should handle empty enabledSuggestionTypes array', async () => {
				const updated = await updateSettings({
					enabledSuggestionTypes: []
				});

				expect(updated.enabledSuggestionTypes).toEqual([]);
			});

			it('should update maxSuggestionsPerType', async () => {
				const updated = await updateSettings({
					maxSuggestionsPerType: 25
				});

				expect(updated.maxSuggestionsPerType).toBe(25);
			});
		});

		describe('Persistence', () => {
			it('should persist updated settings to localStorage', async () => {
				await updateSettings({ minRelevanceScore: 80 });

				const stored = store['ai-suggestion-settings'];
				expect(stored).toBeDefined();

				const parsed = JSON.parse(stored!);
				expect(parsed.minRelevanceScore).toBe(80);
			});

			it('should persist all settings after partial update', async () => {
				await updateSettings({ enableAutoAnalysis: false });

				const stored = JSON.parse(store['ai-suggestion-settings']!);

				expect(stored).toHaveProperty('enableAutoAnalysis');
				expect(stored).toHaveProperty('analysisFrequencyHours');
				expect(stored).toHaveProperty('minRelevanceScore');
				expect(stored).toHaveProperty('enabledSuggestionTypes');
				expect(stored).toHaveProperty('maxSuggestionsPerType');
			});

			it('should be retrievable after update', async () => {
				await updateSettings({ analysisFrequencyHours: 6 });

				const retrieved = await getSettings();
				expect(retrieved.analysisFrequencyHours).toBe(6);
			});

			it('should handle multiple sequential updates', async () => {
				await updateSettings({ minRelevanceScore: 40 });
				await updateSettings({ analysisFrequencyHours: 12 });
				await updateSettings({ enableAutoAnalysis: false });

				const final = await getSettings();

				expect(final.minRelevanceScore).toBe(40);
				expect(final.analysisFrequencyHours).toBe(12);
				expect(final.enableAutoAnalysis).toBe(false);
			});
		});

		describe('Return Value', () => {
			it('should return updated settings object', async () => {
				const result = await updateSettings({ minRelevanceScore: 55 });

				expect(result).toHaveProperty('enableAutoAnalysis');
				expect(result).toHaveProperty('analysisFrequencyHours');
				expect(result).toHaveProperty('minRelevanceScore');
				expect(result).toHaveProperty('enabledSuggestionTypes');
				expect(result).toHaveProperty('maxSuggestionsPerType');
				expect(result.minRelevanceScore).toBe(55);
			});

			it('should return complete settings after partial update', async () => {
				const result = await updateSettings({ enableAutoAnalysis: false });

				expect(result).toEqual({
					enableAutoAnalysis: false,
					analysisFrequencyHours: 24,
					minRelevanceScore: 30,
					enabledSuggestionTypes: DEFAULT_SUGGESTION_SETTINGS.enabledSuggestionTypes,
					maxSuggestionsPerType: 10
				});
			});
		});

		describe('Edge Cases', () => {
			it('should handle empty update object', async () => {
				const before = await getSettings();
				const result = await updateSettings({});
				const after = await getSettings();

				expect(result).toEqual(before);
				expect(after).toEqual(before);
			});

			it('should handle updating to same values', async () => {
				await updateSettings({ minRelevanceScore: 30 }); // Same as default

				const settings = await getSettings();
				expect(settings.minRelevanceScore).toBe(30);
			});

			it('should handle extreme values for numeric fields', async () => {
				const result = await updateSettings({
					analysisFrequencyHours: 168, // 1 week
					minRelevanceScore: 100,
					maxSuggestionsPerType: 100
				});

				expect(result.analysisFrequencyHours).toBe(168);
				expect(result.minRelevanceScore).toBe(100);
				expect(result.maxSuggestionsPerType).toBe(100);
			});

			it('should handle minimum values for numeric fields', async () => {
				const result = await updateSettings({
					analysisFrequencyHours: 1,
					minRelevanceScore: 0,
					maxSuggestionsPerType: 1
				});

				expect(result.analysisFrequencyHours).toBe(1);
				expect(result.minRelevanceScore).toBe(0);
				expect(result.maxSuggestionsPerType).toBe(1);
			});
		});

		describe('Validation', () => {
			it('should validate analysisFrequencyHours is positive', async () => {
				await expect(
					updateSettings({ analysisFrequencyHours: -5 })
				).rejects.toThrow(/frequency.*positive/i);
			});

			it('should validate analysisFrequencyHours is not zero', async () => {
				await expect(
					updateSettings({ analysisFrequencyHours: 0 })
				).rejects.toThrow(/frequency.*positive/i);
			});

			it('should validate minRelevanceScore is in range 0-100', async () => {
				await expect(
					updateSettings({ minRelevanceScore: -10 })
				).rejects.toThrow(/relevance.*0.*100/i);
			});

			it('should validate minRelevanceScore does not exceed 100', async () => {
				await expect(
					updateSettings({ minRelevanceScore: 150 })
				).rejects.toThrow(/relevance.*0.*100/i);
			});

			it('should validate maxSuggestionsPerType is positive', async () => {
				await expect(
					updateSettings({ maxSuggestionsPerType: -1 })
				).rejects.toThrow(/max.*suggestions.*positive/i);
			});

			it('should validate enabledSuggestionTypes contains valid types', async () => {
				await expect(
					updateSettings({ enabledSuggestionTypes: ['invalid_type'] as any })
				).rejects.toThrow(/invalid.*suggestion.*type/i);
			});

			it('should allow valid suggestion types', async () => {
				const validTypes = ['relationship', 'plot_thread', 'inconsistency', 'enhancement', 'recommendation'] as const;

				await expect(
					updateSettings({ enabledSuggestionTypes: [...validTypes] })
				).resolves.toBeDefined();
			});
		});
	});

	describe('resetToDefaults', () => {
		it('should reset all settings to defaults', async () => {
			// First, change settings
			await updateSettings({
				enableAutoAnalysis: false,
				analysisFrequencyHours: 48,
				minRelevanceScore: 80,
				enabledSuggestionTypes: ['relationship'],
				maxSuggestionsPerType: 25
			});

			// Verify settings were changed
			const modified = await getSettings();
			expect(modified.enableAutoAnalysis).toBe(false);
			expect(modified.analysisFrequencyHours).toBe(48);

			// Reset to defaults
			const reset = await resetToDefaults();

			expect(reset).toEqual(DEFAULT_SUGGESTION_SETTINGS);
		});

		it('should clear custom settings from localStorage', async () => {
			// Set custom settings
			await updateSettings({ minRelevanceScore: 70 });
			expect(store['ai-suggestion-settings']).toBeDefined();

			// Reset
			await resetToDefaults();

			// localStorage should still have the key but with default values
			const stored = JSON.parse(store['ai-suggestion-settings']!);
			expect(stored).toEqual(DEFAULT_SUGGESTION_SETTINGS);
		});

		it('should return default settings object', async () => {
			const result = await resetToDefaults();

			expect(result.enableAutoAnalysis).toBe(true);
			expect(result.analysisFrequencyHours).toBe(24);
			expect(result.minRelevanceScore).toBe(30);
			expect(result.enabledSuggestionTypes).toHaveLength(5);
			expect(result.maxSuggestionsPerType).toBe(10);
		});

		it('should be retrievable after reset', async () => {
			// Modify settings
			await updateSettings({ enableAutoAnalysis: false });

			// Reset
			await resetToDefaults();

			// Get settings again
			const retrieved = await getSettings();
			expect(retrieved).toEqual(DEFAULT_SUGGESTION_SETTINGS);
		});

		it('should work when no custom settings exist', async () => {
			// Ensure no custom settings
			delete store['ai-suggestion-settings'];

			// Reset should still work
			const result = await resetToDefaults();

			expect(result).toEqual(DEFAULT_SUGGESTION_SETTINGS);
		});

		it('should reset after multiple partial updates', async () => {
			await updateSettings({ minRelevanceScore: 40 });
			await updateSettings({ analysisFrequencyHours: 6 });
			await updateSettings({ enableAutoAnalysis: false });

			const reset = await resetToDefaults();

			expect(reset).toEqual(DEFAULT_SUGGESTION_SETTINGS);
		});
	});

	describe('Integration Tests', () => {
		it('should support complete workflow: get, update, reset', async () => {
			// Get initial defaults
			const initial = await getSettings();
			expect(initial.enableAutoAnalysis).toBe(true);

			// Update settings
			const updated = await updateSettings({
				enableAutoAnalysis: false,
				minRelevanceScore: 60
			});
			expect(updated.enableAutoAnalysis).toBe(false);
			expect(updated.minRelevanceScore).toBe(60);

			// Verify persistence
			const retrieved = await getSettings();
			expect(retrieved.enableAutoAnalysis).toBe(false);
			expect(retrieved.minRelevanceScore).toBe(60);

			// Reset to defaults
			const reset = await resetToDefaults();
			expect(reset).toEqual(DEFAULT_SUGGESTION_SETTINGS);

			// Verify reset persisted
			const final = await getSettings();
			expect(final).toEqual(DEFAULT_SUGGESTION_SETTINGS);
		});

		it('should handle rapid sequential operations', async () => {
			await updateSettings({ minRelevanceScore: 40 });
			await updateSettings({ minRelevanceScore: 50 });
			await updateSettings({ minRelevanceScore: 60 });

			const result = await getSettings();
			expect(result.minRelevanceScore).toBe(60);
		});

		it('should maintain consistency across multiple get calls', async () => {
			await updateSettings({ analysisFrequencyHours: 18 });

			const first = await getSettings();
			const second = await getSettings();
			const third = await getSettings();

			expect(first).toEqual(second);
			expect(second).toEqual(third);
		});
	});
});
