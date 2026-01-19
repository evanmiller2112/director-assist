/**
 * Tests for Relationship Context Settings Service (TDD RED Phase)
 *
 * Covers:
 * - getRelationshipContextSettings returns defaults when no settings stored
 * - getRelationshipContextSettings returns stored settings merged with defaults
 * - setRelationshipContextSettings saves partial settings correctly
 * - resetRelationshipContextSettings clears stored settings
 * - Handle invalid JSON in localStorage gracefully
 * - Handle SSR (typeof window === 'undefined')
 * - Validate settings ranges and constraints
 *
 * NOTE: These tests are expected to FAIL initially (RED phase).
 * Implementation will be added in the GREEN phase to make them pass.
 */
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
	getRelationshipContextSettings,
	setRelationshipContextSettings,
	resetRelationshipContextSettings,
	DEFAULT_RELATIONSHIP_CONTEXT_SETTINGS,
	type RelationshipContextSettings
} from './relationshipContextSettingsService';

describe('relationshipContextSettingsService', () => {
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

	describe('DEFAULT_RELATIONSHIP_CONTEXT_SETTINGS', () => {
		it('should have enabled=true as default', () => {
			expect(DEFAULT_RELATIONSHIP_CONTEXT_SETTINGS.enabled).toBe(true);
		});

		it('should have maxRelatedEntities=20 as default', () => {
			expect(DEFAULT_RELATIONSHIP_CONTEXT_SETTINGS.maxRelatedEntities).toBe(20);
		});

		it('should have maxCharacters=4000 as default', () => {
			expect(DEFAULT_RELATIONSHIP_CONTEXT_SETTINGS.maxCharacters).toBe(4000);
		});

		it('should have contextBudgetAllocation=50 as default', () => {
			expect(DEFAULT_RELATIONSHIP_CONTEXT_SETTINGS.contextBudgetAllocation).toBe(50);
		});

		it('should have autoGenerateSummaries=false as default', () => {
			expect(DEFAULT_RELATIONSHIP_CONTEXT_SETTINGS.autoGenerateSummaries).toBe(false);
		});

		it('should define all required interface properties', () => {
			expect(DEFAULT_RELATIONSHIP_CONTEXT_SETTINGS).toHaveProperty('enabled');
			expect(DEFAULT_RELATIONSHIP_CONTEXT_SETTINGS).toHaveProperty('maxRelatedEntities');
			expect(DEFAULT_RELATIONSHIP_CONTEXT_SETTINGS).toHaveProperty('maxCharacters');
			expect(DEFAULT_RELATIONSHIP_CONTEXT_SETTINGS).toHaveProperty('contextBudgetAllocation');
			expect(DEFAULT_RELATIONSHIP_CONTEXT_SETTINGS).toHaveProperty('autoGenerateSummaries');
		});
	});

	describe('getRelationshipContextSettings', () => {
		describe('Default Values', () => {
			it('should return defaults when no settings stored', () => {
				const settings = getRelationshipContextSettings();

				expect(settings).toEqual(DEFAULT_RELATIONSHIP_CONTEXT_SETTINGS);
			});

			it('should return defaults when localStorage is empty', () => {
				store['relationship-context-settings'] = '';

				const settings = getRelationshipContextSettings();

				expect(settings).toEqual(DEFAULT_RELATIONSHIP_CONTEXT_SETTINGS);
			});

			it('should return defaults when stored value is null', () => {
				store['relationship-context-settings'] = null as any;

				const settings = getRelationshipContextSettings();

				expect(settings).toEqual(DEFAULT_RELATIONSHIP_CONTEXT_SETTINGS);
			});

			it('should return defaults when localStorage key does not exist', () => {
				// Ensure key is not set
				delete store['relationship-context-settings'];

				const settings = getRelationshipContextSettings();

				expect(settings.enabled).toBe(true);
				expect(settings.maxRelatedEntities).toBe(20);
				expect(settings.maxCharacters).toBe(4000);
				expect(settings.contextBudgetAllocation).toBe(50);
				expect(settings.autoGenerateSummaries).toBe(false);
			});
		});

		describe('Stored Settings Retrieval', () => {
			it('should return stored settings when they exist', () => {
				const customSettings: RelationshipContextSettings = {
					enabled: false,
					maxRelatedEntities: 10,
					maxCharacters: 2000,
					contextBudgetAllocation: 30,
					autoGenerateSummaries: true
				};

				store['relationship-context-settings'] = JSON.stringify(customSettings);

				const settings = getRelationshipContextSettings();

				expect(settings).toEqual(customSettings);
			});

			it('should merge partial stored settings with defaults', () => {
				const partialSettings = {
					enabled: false,
					maxRelatedEntities: 15
					// Missing other properties
				};

				store['relationship-context-settings'] = JSON.stringify(partialSettings);

				const settings = getRelationshipContextSettings();

				expect(settings.enabled).toBe(false);
				expect(settings.maxRelatedEntities).toBe(15);
				// Should use defaults for missing properties
				expect(settings.maxCharacters).toBe(4000);
				expect(settings.contextBudgetAllocation).toBe(50);
				expect(settings.autoGenerateSummaries).toBe(false);
			});

			it('should merge settings when only enabled is stored', () => {
				const partialSettings = { enabled: false };

				store['relationship-context-settings'] = JSON.stringify(partialSettings);

				const settings = getRelationshipContextSettings();

				expect(settings.enabled).toBe(false);
				expect(settings.maxRelatedEntities).toBe(20);
				expect(settings.maxCharacters).toBe(4000);
				expect(settings.contextBudgetAllocation).toBe(50);
				expect(settings.autoGenerateSummaries).toBe(false);
			});

			it('should merge settings when only maxRelatedEntities is stored', () => {
				const partialSettings = { maxRelatedEntities: 50 };

				store['relationship-context-settings'] = JSON.stringify(partialSettings);

				const settings = getRelationshipContextSettings();

				expect(settings.enabled).toBe(true);
				expect(settings.maxRelatedEntities).toBe(50);
				expect(settings.maxCharacters).toBe(4000);
			});

			it('should merge settings when only maxCharacters is stored', () => {
				const partialSettings = { maxCharacters: 10000 };

				store['relationship-context-settings'] = JSON.stringify(partialSettings);

				const settings = getRelationshipContextSettings();

				expect(settings.enabled).toBe(true);
				expect(settings.maxRelatedEntities).toBe(20);
				expect(settings.maxCharacters).toBe(10000);
			});

			it('should merge settings when only contextBudgetAllocation is stored', () => {
				const partialSettings = { contextBudgetAllocation: 75 };

				store['relationship-context-settings'] = JSON.stringify(partialSettings);

				const settings = getRelationshipContextSettings();

				expect(settings.contextBudgetAllocation).toBe(75);
				expect(settings.enabled).toBe(true);
				expect(settings.maxRelatedEntities).toBe(20);
			});

			it('should merge settings when only autoGenerateSummaries is stored', () => {
				const partialSettings = { autoGenerateSummaries: true };

				store['relationship-context-settings'] = JSON.stringify(partialSettings);

				const settings = getRelationshipContextSettings();

				expect(settings.autoGenerateSummaries).toBe(true);
				expect(settings.enabled).toBe(true);
				expect(settings.maxRelatedEntities).toBe(20);
			});

			it('should preserve all stored boolean values correctly', () => {
				const settings1 = { enabled: true, autoGenerateSummaries: false };
				store['relationship-context-settings'] = JSON.stringify(settings1);

				const result1 = getRelationshipContextSettings();
				expect(result1.enabled).toBe(true);
				expect(result1.autoGenerateSummaries).toBe(false);

				const settings2 = { enabled: false, autoGenerateSummaries: true };
				store['relationship-context-settings'] = JSON.stringify(settings2);

				const result2 = getRelationshipContextSettings();
				expect(result2.enabled).toBe(false);
				expect(result2.autoGenerateSummaries).toBe(true);
			});
		});

		describe('Invalid JSON Handling', () => {
			it('should return defaults when JSON is malformed', () => {
				store['relationship-context-settings'] = 'invalid-json{]';

				const settings = getRelationshipContextSettings();

				expect(settings).toEqual(DEFAULT_RELATIONSHIP_CONTEXT_SETTINGS);
			});

			it('should return defaults when JSON is incomplete', () => {
				store['relationship-context-settings'] = '{"enabled": true, "maxRelatedEntities"';

				const settings = getRelationshipContextSettings();

				expect(settings).toEqual(DEFAULT_RELATIONSHIP_CONTEXT_SETTINGS);
			});

			it('should return defaults when stored value is not JSON object', () => {
				store['relationship-context-settings'] = 'just a string';

				const settings = getRelationshipContextSettings();

				expect(settings).toEqual(DEFAULT_RELATIONSHIP_CONTEXT_SETTINGS);
			});

			it('should return defaults when JSON is an array instead of object', () => {
				store['relationship-context-settings'] = JSON.stringify([1, 2, 3]);

				const settings = getRelationshipContextSettings();

				expect(settings).toEqual(DEFAULT_RELATIONSHIP_CONTEXT_SETTINGS);
			});

			it('should return defaults when JSON is null', () => {
				store['relationship-context-settings'] = JSON.stringify(null);

				const settings = getRelationshipContextSettings();

				expect(settings).toEqual(DEFAULT_RELATIONSHIP_CONTEXT_SETTINGS);
			});

			it('should not throw error when JSON parsing fails', () => {
				store['relationship-context-settings'] = 'corrupted{data}';

				expect(() => getRelationshipContextSettings()).not.toThrow();
			});
		});

		describe('SSR Context Handling', () => {
			it('should return defaults when window is undefined (SSR)', () => {
				// Simulate SSR by making window undefined
				const originalWindow = global.window;
				// @ts-expect-error - Testing SSR behavior
				delete global.window;

				const settings = getRelationshipContextSettings();

				expect(settings).toEqual(DEFAULT_RELATIONSHIP_CONTEXT_SETTINGS);

				// Restore window
				global.window = originalWindow;
			});

			it('should not access localStorage in SSR context', () => {
				const originalWindow = global.window;
				// @ts-expect-error - Testing SSR behavior
				delete global.window;

				// This should not throw even though localStorage is unavailable
				expect(() => getRelationshipContextSettings()).not.toThrow();

				// Restore window
				global.window = originalWindow;
			});

			it('should handle typeof window === "undefined" gracefully', () => {
				const originalWindow = global.window;
				// @ts-expect-error - Testing SSR behavior
				delete global.window;

				const settings = getRelationshipContextSettings();

				expect(settings.enabled).toBe(true);
				expect(settings.maxRelatedEntities).toBe(20);

				// Restore window
				global.window = originalWindow;
			});
		});

		describe('Edge Cases', () => {
			it('should handle extra properties in stored settings gracefully', () => {
				const settingsWithExtra = {
					enabled: true,
					maxRelatedEntities: 25,
					maxCharacters: 5000,
					contextBudgetAllocation: 60,
					autoGenerateSummaries: true,
					extraProperty: 'should be ignored'
				};

				store['relationship-context-settings'] = JSON.stringify(settingsWithExtra);

				const settings = getRelationshipContextSettings();

				expect(settings.enabled).toBe(true);
				expect(settings.maxRelatedEntities).toBe(25);
				expect(settings.maxCharacters).toBe(5000);
				expect(settings.contextBudgetAllocation).toBe(60);
				expect(settings.autoGenerateSummaries).toBe(true);
			});

			it('should handle whitespace in stored JSON', () => {
				const settingsJson = `
					{
						"enabled": true,
						"maxRelatedEntities": 20
					}
				`;

				store['relationship-context-settings'] = settingsJson;

				const settings = getRelationshipContextSettings();

				expect(settings.enabled).toBe(true);
				expect(settings.maxRelatedEntities).toBe(20);
			});

			it('should handle localStorage.getItem throwing error', () => {
				vi.mocked(global.localStorage.getItem).mockImplementation(() => {
					throw new Error('localStorage access denied');
				});

				expect(() => getRelationshipContextSettings()).not.toThrow();

				const settings = getRelationshipContextSettings();
				expect(settings).toEqual(DEFAULT_RELATIONSHIP_CONTEXT_SETTINGS);
			});

			it('should handle numeric string values correctly', () => {
				// Numbers stored as strings in JSON should parse correctly
				const settingsJson = '{"maxRelatedEntities": "25", "maxCharacters": "5000"}';

				store['relationship-context-settings'] = settingsJson;

				const settings = getRelationshipContextSettings();

				// Should convert string numbers to actual numbers
				expect(typeof settings.maxRelatedEntities).toBe('number');
				expect(typeof settings.maxCharacters).toBe('number');
			});
		});

		describe('Boundary Values', () => {
			it('should handle maxRelatedEntities at minimum boundary (1)', () => {
				const settings = { maxRelatedEntities: 1 };
				store['relationship-context-settings'] = JSON.stringify(settings);

				const result = getRelationshipContextSettings();

				expect(result.maxRelatedEntities).toBe(1);
			});

			it('should handle maxRelatedEntities at maximum boundary (50)', () => {
				const settings = { maxRelatedEntities: 50 };
				store['relationship-context-settings'] = JSON.stringify(settings);

				const result = getRelationshipContextSettings();

				expect(result.maxRelatedEntities).toBe(50);
			});

			it('should handle maxCharacters at minimum boundary (1000)', () => {
				const settings = { maxCharacters: 1000 };
				store['relationship-context-settings'] = JSON.stringify(settings);

				const result = getRelationshipContextSettings();

				expect(result.maxCharacters).toBe(1000);
			});

			it('should handle maxCharacters at maximum boundary (10000)', () => {
				const settings = { maxCharacters: 10000 };
				store['relationship-context-settings'] = JSON.stringify(settings);

				const result = getRelationshipContextSettings();

				expect(result.maxCharacters).toBe(10000);
			});

			it('should handle contextBudgetAllocation at minimum boundary (0)', () => {
				const settings = { contextBudgetAllocation: 0 };
				store['relationship-context-settings'] = JSON.stringify(settings);

				const result = getRelationshipContextSettings();

				expect(result.contextBudgetAllocation).toBe(0);
			});

			it('should handle contextBudgetAllocation at maximum boundary (100)', () => {
				const settings = { contextBudgetAllocation: 100 };
				store['relationship-context-settings'] = JSON.stringify(settings);

				const result = getRelationshipContextSettings();

				expect(result.contextBudgetAllocation).toBe(100);
			});
		});
	});

	describe('setRelationshipContextSettings', () => {
		describe('Basic Storage', () => {
			it('should save complete settings to localStorage', () => {
				const settings: RelationshipContextSettings = {
					enabled: false,
					maxRelatedEntities: 15,
					maxCharacters: 3000,
					contextBudgetAllocation: 40,
					autoGenerateSummaries: true
				};

				setRelationshipContextSettings(settings);

				expect(localStorage.setItem).toHaveBeenCalledWith(
					'relationship-context-settings',
					JSON.stringify(settings)
				);
			});

			it('should save settings to store correctly', () => {
				const settings: RelationshipContextSettings = {
					enabled: true,
					maxRelatedEntities: 25,
					maxCharacters: 5000,
					contextBudgetAllocation: 60,
					autoGenerateSummaries: false
				};

				setRelationshipContextSettings(settings);

				const stored = store['relationship-context-settings'];
				expect(stored).toBeDefined();
				expect(JSON.parse(stored)).toEqual(settings);
			});

			it('should overwrite existing settings', () => {
				const oldSettings: RelationshipContextSettings = {
					enabled: true,
					maxRelatedEntities: 20,
					maxCharacters: 4000,
					contextBudgetAllocation: 50,
					autoGenerateSummaries: false
				};

				const newSettings: RelationshipContextSettings = {
					enabled: false,
					maxRelatedEntities: 10,
					maxCharacters: 2000,
					contextBudgetAllocation: 25,
					autoGenerateSummaries: true
				};

				setRelationshipContextSettings(oldSettings);
				setRelationshipContextSettings(newSettings);

				const stored = JSON.parse(store['relationship-context-settings']);
				expect(stored).toEqual(newSettings);
			});
		});

		describe('Partial Settings', () => {
			it('should save partial settings correctly', () => {
				const partialSettings = {
					enabled: false
				} as Partial<RelationshipContextSettings>;

				setRelationshipContextSettings(partialSettings);

				const stored = JSON.parse(store['relationship-context-settings']);
				expect(stored.enabled).toBe(false);
			});

			it('should save partial settings with multiple properties', () => {
				const partialSettings = {
					maxRelatedEntities: 30,
					maxCharacters: 6000
				} as Partial<RelationshipContextSettings>;

				setRelationshipContextSettings(partialSettings);

				const stored = JSON.parse(store['relationship-context-settings']);
				expect(stored.maxRelatedEntities).toBe(30);
				expect(stored.maxCharacters).toBe(6000);
			});

			it('should allow updating single boolean property', () => {
				const settings = { autoGenerateSummaries: true } as Partial<RelationshipContextSettings>;

				setRelationshipContextSettings(settings);

				const stored = JSON.parse(store['relationship-context-settings']);
				expect(stored.autoGenerateSummaries).toBe(true);
			});

			it('should allow updating single numeric property', () => {
				const settings = {
					contextBudgetAllocation: 75
				} as Partial<RelationshipContextSettings>;

				setRelationshipContextSettings(settings);

				const stored = JSON.parse(store['relationship-context-settings']);
				expect(stored.contextBudgetAllocation).toBe(75);
			});
		});

		describe('Boundary Values', () => {
			it('should save maxRelatedEntities=1 (minimum)', () => {
				const settings: RelationshipContextSettings = {
					...DEFAULT_RELATIONSHIP_CONTEXT_SETTINGS,
					maxRelatedEntities: 1
				};

				setRelationshipContextSettings(settings);

				const stored = JSON.parse(store['relationship-context-settings']);
				expect(stored.maxRelatedEntities).toBe(1);
			});

			it('should save maxRelatedEntities=50 (maximum)', () => {
				const settings: RelationshipContextSettings = {
					...DEFAULT_RELATIONSHIP_CONTEXT_SETTINGS,
					maxRelatedEntities: 50
				};

				setRelationshipContextSettings(settings);

				const stored = JSON.parse(store['relationship-context-settings']);
				expect(stored.maxRelatedEntities).toBe(50);
			});

			it('should save maxCharacters=1000 (minimum)', () => {
				const settings: RelationshipContextSettings = {
					...DEFAULT_RELATIONSHIP_CONTEXT_SETTINGS,
					maxCharacters: 1000
				};

				setRelationshipContextSettings(settings);

				const stored = JSON.parse(store['relationship-context-settings']);
				expect(stored.maxCharacters).toBe(1000);
			});

			it('should save maxCharacters=10000 (maximum)', () => {
				const settings: RelationshipContextSettings = {
					...DEFAULT_RELATIONSHIP_CONTEXT_SETTINGS,
					maxCharacters: 10000
				};

				setRelationshipContextSettings(settings);

				const stored = JSON.parse(store['relationship-context-settings']);
				expect(stored.maxCharacters).toBe(10000);
			});

			it('should save contextBudgetAllocation=0 (minimum)', () => {
				const settings: RelationshipContextSettings = {
					...DEFAULT_RELATIONSHIP_CONTEXT_SETTINGS,
					contextBudgetAllocation: 0
				};

				setRelationshipContextSettings(settings);

				const stored = JSON.parse(store['relationship-context-settings']);
				expect(stored.contextBudgetAllocation).toBe(0);
			});

			it('should save contextBudgetAllocation=100 (maximum)', () => {
				const settings: RelationshipContextSettings = {
					...DEFAULT_RELATIONSHIP_CONTEXT_SETTINGS,
					contextBudgetAllocation: 100
				};

				setRelationshipContextSettings(settings);

				const stored = JSON.parse(store['relationship-context-settings']);
				expect(stored.contextBudgetAllocation).toBe(100);
			});
		});

		describe('SSR Context Handling', () => {
			it('should not throw when window is undefined', () => {
				const originalWindow = global.window;
				// @ts-expect-error - Testing SSR behavior
				delete global.window;

				const settings: RelationshipContextSettings = {
					enabled: false,
					maxRelatedEntities: 10,
					maxCharacters: 2000,
					contextBudgetAllocation: 30,
					autoGenerateSummaries: true
				};

				expect(() => setRelationshipContextSettings(settings)).not.toThrow();

				// Restore window
				global.window = originalWindow;
			});

			it('should handle SSR gracefully without accessing localStorage', () => {
				const originalWindow = global.window;
				// @ts-expect-error - Testing SSR behavior
				delete global.window;

				setRelationshipContextSettings({ enabled: false });

				// Should not have called localStorage methods
				// (can't verify since window is undefined)

				// Restore window
				global.window = originalWindow;
			});
		});

		describe('Edge Cases', () => {
			it('should handle localStorage.setItem throwing error', () => {
				vi.mocked(global.localStorage.setItem).mockImplementation(() => {
					throw new Error('localStorage quota exceeded');
				});

				const settings: RelationshipContextSettings = {
					enabled: true,
					maxRelatedEntities: 20,
					maxCharacters: 4000,
					contextBudgetAllocation: 50,
					autoGenerateSummaries: false
				};

				expect(() => setRelationshipContextSettings(settings)).not.toThrow();
			});

			it('should handle saving boolean false correctly', () => {
				const settings: RelationshipContextSettings = {
					enabled: false,
					maxRelatedEntities: 20,
					maxCharacters: 4000,
					contextBudgetAllocation: 50,
					autoGenerateSummaries: false
				};

				setRelationshipContextSettings(settings);

				const stored = JSON.parse(store['relationship-context-settings']);
				expect(stored.enabled).toBe(false);
				expect(stored.autoGenerateSummaries).toBe(false);
			});

			it('should handle saving zero values correctly', () => {
				const settings: RelationshipContextSettings = {
					enabled: true,
					maxRelatedEntities: 1,
					maxCharacters: 1000,
					contextBudgetAllocation: 0,
					autoGenerateSummaries: false
				};

				setRelationshipContextSettings(settings);

				const stored = JSON.parse(store['relationship-context-settings']);
				expect(stored.contextBudgetAllocation).toBe(0);
			});
		});

		describe('Integration with getRelationshipContextSettings', () => {
			it('should allow get to retrieve saved settings', () => {
				const settings: RelationshipContextSettings = {
					enabled: false,
					maxRelatedEntities: 15,
					maxCharacters: 3000,
					contextBudgetAllocation: 40,
					autoGenerateSummaries: true
				};

				setRelationshipContextSettings(settings);
				const retrieved = getRelationshipContextSettings();

				expect(retrieved).toEqual(settings);
			});

			it('should persist across multiple get calls', () => {
				const settings: RelationshipContextSettings = {
					enabled: true,
					maxRelatedEntities: 25,
					maxCharacters: 5000,
					contextBudgetAllocation: 60,
					autoGenerateSummaries: false
				};

				setRelationshipContextSettings(settings);

				expect(getRelationshipContextSettings()).toEqual(settings);
				expect(getRelationshipContextSettings()).toEqual(settings);
			});

			it('should allow partial updates to be merged', () => {
				const fullSettings: RelationshipContextSettings = {
					enabled: true,
					maxRelatedEntities: 20,
					maxCharacters: 4000,
					contextBudgetAllocation: 50,
					autoGenerateSummaries: false
				};

				setRelationshipContextSettings(fullSettings);

				const partialUpdate = {
					enabled: false,
					maxRelatedEntities: 30
				} as Partial<RelationshipContextSettings>;

				setRelationshipContextSettings(partialUpdate);

				const retrieved = getRelationshipContextSettings();
				expect(retrieved.enabled).toBe(false);
				expect(retrieved.maxRelatedEntities).toBe(30);
			});
		});
	});

	describe('resetRelationshipContextSettings', () => {
		describe('Basic Reset', () => {
			it('should remove settings from localStorage', () => {
				// First save some settings
				const settings: RelationshipContextSettings = {
					enabled: false,
					maxRelatedEntities: 15,
					maxCharacters: 3000,
					contextBudgetAllocation: 40,
					autoGenerateSummaries: true
				};

				setRelationshipContextSettings(settings);

				// Then reset
				resetRelationshipContextSettings();

				expect(localStorage.removeItem).toHaveBeenCalledWith('relationship-context-settings');
			});

			it('should clear settings from store', () => {
				// First save some settings
				const settings: RelationshipContextSettings = {
					enabled: false,
					maxRelatedEntities: 15,
					maxCharacters: 3000,
					contextBudgetAllocation: 40,
					autoGenerateSummaries: true
				};

				setRelationshipContextSettings(settings);
				expect(store['relationship-context-settings']).toBeDefined();

				// Then reset
				resetRelationshipContextSettings();

				expect(store['relationship-context-settings']).toBeUndefined();
			});

			it('should not throw when no settings exist', () => {
				expect(() => resetRelationshipContextSettings()).not.toThrow();
			});

			it('should not throw when called multiple times', () => {
				resetRelationshipContextSettings();
				resetRelationshipContextSettings();

				expect(() => resetRelationshipContextSettings()).not.toThrow();
			});
		});

		describe('Integration with getRelationshipContextSettings', () => {
			it('should return defaults after reset', () => {
				// Save custom settings
				const settings: RelationshipContextSettings = {
					enabled: false,
					maxRelatedEntities: 15,
					maxCharacters: 3000,
					contextBudgetAllocation: 40,
					autoGenerateSummaries: true
				};

				setRelationshipContextSettings(settings);

				// Verify custom settings are saved
				let retrieved = getRelationshipContextSettings();
				expect(retrieved).toEqual(settings);

				// Reset
				resetRelationshipContextSettings();

				// Should return defaults
				retrieved = getRelationshipContextSettings();
				expect(retrieved).toEqual(DEFAULT_RELATIONSHIP_CONTEXT_SETTINGS);
			});

			it('should allow new settings to be saved after reset', () => {
				// Save and reset
				setRelationshipContextSettings({ enabled: false });
				resetRelationshipContextSettings();

				// Save new settings
				const newSettings: RelationshipContextSettings = {
					enabled: true,
					maxRelatedEntities: 30,
					maxCharacters: 6000,
					contextBudgetAllocation: 70,
					autoGenerateSummaries: true
				};

				setRelationshipContextSettings(newSettings);

				const retrieved = getRelationshipContextSettings();
				expect(retrieved).toEqual(newSettings);
			});
		});

		describe('SSR Context Handling', () => {
			it('should not throw when window is undefined', () => {
				const originalWindow = global.window;
				// @ts-expect-error - Testing SSR behavior
				delete global.window;

				expect(() => resetRelationshipContextSettings()).not.toThrow();

				// Restore window
				global.window = originalWindow;
			});

			it('should handle SSR gracefully without accessing localStorage', () => {
				const originalWindow = global.window;
				// @ts-expect-error - Testing SSR behavior
				delete global.window;

				resetRelationshipContextSettings();

				// Should not crash or access localStorage

				// Restore window
				global.window = originalWindow;
			});
		});

		describe('Edge Cases', () => {
			it('should handle localStorage.removeItem throwing error', () => {
				vi.mocked(global.localStorage.removeItem).mockImplementation(() => {
					throw new Error('localStorage access denied');
				});

				expect(() => resetRelationshipContextSettings()).not.toThrow();
			});

			it('should handle resetting when localStorage is corrupted', () => {
				store['relationship-context-settings'] = 'corrupted{data}';

				expect(() => resetRelationshipContextSettings()).not.toThrow();

				// After reset, get should return defaults
				const settings = getRelationshipContextSettings();
				expect(settings).toEqual(DEFAULT_RELATIONSHIP_CONTEXT_SETTINGS);
			});
		});
	});

	describe('localStorage Key Consistency', () => {
		it('should use "relationship-context-settings" as storage key', () => {
			const settings: RelationshipContextSettings = {
				enabled: true,
				maxRelatedEntities: 20,
				maxCharacters: 4000,
				contextBudgetAllocation: 50,
				autoGenerateSummaries: false
			};

			setRelationshipContextSettings(settings);

			expect(localStorage.setItem).toHaveBeenCalledWith(
				'relationship-context-settings',
				expect.any(String)
			);
		});

		it('should use same key for get and set operations', () => {
			const settings: RelationshipContextSettings = {
				enabled: false,
				maxRelatedEntities: 10,
				maxCharacters: 2000,
				contextBudgetAllocation: 30,
				autoGenerateSummaries: true
			};

			setRelationshipContextSettings(settings);
			getRelationshipContextSettings();

			expect(localStorage.setItem).toHaveBeenCalledWith(
				'relationship-context-settings',
				expect.any(String)
			);
			expect(localStorage.getItem).toHaveBeenCalledWith('relationship-context-settings');
		});

		it('should use same key for reset operation', () => {
			resetRelationshipContextSettings();

			expect(localStorage.removeItem).toHaveBeenCalledWith('relationship-context-settings');
		});
	});
});
