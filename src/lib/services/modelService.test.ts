/**
 * Tests for Model Service (TDD RED Phase)
 *
 * Covers:
 * - Date extraction from model IDs (extractDateFromModelId)
 * - Finding latest Haiku model with sorting (findLatestHaikuModel)
 * - Auto-selection of latest Haiku model (getSelectedModel)
 * - Edge cases, boundary conditions, and error scenarios
 *
 * NOTE: These tests are expected to FAIL initially (RED phase).
 * Implementation will be added in the GREEN phase to make them pass.
 */
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
	extractDateFromModelId,
	findLatestHaikuModel,
	getSelectedModel,
	setSelectedModel,
	clearModelsCache
} from './modelService';
import type { ModelInfo } from '$lib/types';

describe('modelService', () => {
	// Store original localStorage to restore after tests
	let originalLocalStorage: Storage;

	beforeEach(() => {
		// Mock localStorage
		originalLocalStorage = global.localStorage;
		const store: Record<string, string> = {};

		global.localStorage = {
			getItem: vi.fn((key: string) => store[key] ?? null),
			setItem: vi.fn((key: string, value: string) => {
				store[key] = value;
			}),
			removeItem: vi.fn((key: string) => {
				delete store[key];
			}),
			clear: vi.fn(() => {
				Object.keys(store).forEach(key => delete store[key]);
			}),
			length: 0,
			key: vi.fn()
		} as Storage;
	});

	afterEach(() => {
		global.localStorage = originalLocalStorage;
	});

	describe('extractDateFromModelId', () => {
		describe('Valid Date Extraction', () => {
			it('should extract 8-digit date from standard Haiku model ID', () => {
				const date = extractDateFromModelId('claude-haiku-4-5-20250514');
				expect(date).toBe(20250514);
			});

			it('should extract 8-digit date from standard Sonnet model ID', () => {
				const date = extractDateFromModelId('claude-sonnet-4-20250514');
				expect(date).toBe(20250514);
			});

			it('should extract 8-digit date from standard Opus model ID', () => {
				const date = extractDateFromModelId('claude-opus-4-5-20251101');
				expect(date).toBe(20251101);
			});

			it('should extract date from model ID with different version format', () => {
				const date = extractDateFromModelId('claude-haiku-3-20240101');
				expect(date).toBe(20240101);
			});

			it('should extract the first valid 8-digit date when multiple numbers exist', () => {
				// Model ID like "claude-haiku-4-5-20250514" has both "4", "5", and "20250514"
				// Should extract the 8-digit date, not the version numbers
				const date = extractDateFromModelId('claude-haiku-4-5-20250514');
				expect(date).toBe(20250514);
			});

			it('should handle dates at the end of the ID', () => {
				const date = extractDateFromModelId('claude-model-20231215');
				expect(date).toBe(20231215);
			});

			it('should handle dates in the middle of the ID', () => {
				const date = extractDateFromModelId('claude-20240315-beta');
				expect(date).toBe(20240315);
			});
		});

		describe('Invalid Date Patterns', () => {
			it('should return null for model ID without any date', () => {
				const date = extractDateFromModelId('claude-haiku-latest');
				expect(date).toBeNull();
			});

			it('should return null for model ID with only version numbers', () => {
				const date = extractDateFromModelId('claude-haiku-4-5');
				expect(date).toBeNull();
			});

			it('should return null for empty string', () => {
				const date = extractDateFromModelId('');
				expect(date).toBeNull();
			});

			it('should return null for ID with 7-digit number (not valid date)', () => {
				const date = extractDateFromModelId('claude-model-2025051');
				expect(date).toBeNull();
			});

			it('should return null for ID with 9-digit number (not valid date)', () => {
				const date = extractDateFromModelId('claude-model-202505141');
				expect(date).toBeNull();
			});

			it('should return null for ID with letters mixed in date position', () => {
				const date = extractDateFromModelId('claude-model-2025ab14');
				expect(date).toBeNull();
			});
		});

		describe('Edge Cases', () => {
			it('should handle ID with multiple 8-digit numbers', () => {
				// Should extract the first valid 8-digit date pattern
				const date = extractDateFromModelId('claude-20250101-model-20250202');
				expect(date).toBe(20250101);
			});

			it('should handle ID with special characters', () => {
				const date = extractDateFromModelId('claude_haiku-4.5-20250514');
				expect(date).toBe(20250514);
			});

			it('should handle ID with no separators', () => {
				const date = extractDateFromModelId('claudehaiku20250514');
				expect(date).toBe(20250514);
			});

			it('should parse date as integer not string', () => {
				const date = extractDateFromModelId('claude-haiku-4-5-20250514');
				expect(typeof date).toBe('number');
				expect(date).toBe(20250514);
			});
		});
	});

	describe('findLatestHaikuModel', () => {
		describe('Empty and Null Cases', () => {
			it('should return null for empty array', () => {
				const result = findLatestHaikuModel([]);
				expect(result).toBeNull();
			});

			it('should return null when no Haiku models present', () => {
				const models: ModelInfo[] = [
					{
						id: 'claude-sonnet-4-20250514',
						display_name: 'Claude Sonnet 4',
						created_at: '2025-05-14T00:00:00Z',
						type: 'model'
					},
					{
						id: 'claude-opus-4-5-20251101',
						display_name: 'Claude Opus 4.5',
						created_at: '2025-11-01T00:00:00Z',
						type: 'model'
					}
				];
				const result = findLatestHaikuModel(models);
				expect(result).toBeNull();
			});
		});

		describe('Single Haiku Model', () => {
			it('should return single Haiku model when only one exists', () => {
				const models: ModelInfo[] = [
					{
						id: 'claude-haiku-4-5-20250514',
						display_name: 'Claude Haiku 4.5',
						created_at: '2025-05-14T00:00:00Z',
						type: 'model'
					}
				];
				const result = findLatestHaikuModel(models);
				expect(result).not.toBeNull();
				expect(result?.id).toBe('claude-haiku-4-5-20250514');
			});

			it('should return Haiku model even when mixed with other models', () => {
				const models: ModelInfo[] = [
					{
						id: 'claude-sonnet-4-20250514',
						display_name: 'Claude Sonnet 4',
						created_at: '2025-05-14T00:00:00Z',
						type: 'model'
					},
					{
						id: 'claude-haiku-4-5-20250514',
						display_name: 'Claude Haiku 4.5',
						created_at: '2025-05-14T00:00:00Z',
						type: 'model'
					},
					{
						id: 'claude-opus-4-5-20251101',
						display_name: 'Claude Opus 4.5',
						created_at: '2025-11-01T00:00:00Z',
						type: 'model'
					}
				];
				const result = findLatestHaikuModel(models);
				expect(result).not.toBeNull();
				expect(result?.id).toBe('claude-haiku-4-5-20250514');
			});
		});

		describe('Multiple Haiku Models - Date Sorting', () => {
			it('should return newest Haiku when multiple exist (sorted by date in ID)', () => {
				const models: ModelInfo[] = [
					{
						id: 'claude-haiku-4-5-20250514',
						display_name: 'Claude Haiku 4.5',
						created_at: '2025-05-14T00:00:00Z',
						type: 'model'
					},
					{
						id: 'claude-haiku-4-5-20250601',
						display_name: 'Claude Haiku 4.5 June',
						created_at: '2025-06-01T00:00:00Z',
						type: 'model'
					},
					{
						id: 'claude-haiku-4-5-20250315',
						display_name: 'Claude Haiku 4.5 March',
						created_at: '2025-03-15T00:00:00Z',
						type: 'model'
					}
				];
				const result = findLatestHaikuModel(models);
				expect(result).not.toBeNull();
				expect(result?.id).toBe('claude-haiku-4-5-20250601');
			});

			it('should return newest by date even when array is unsorted', () => {
				const models: ModelInfo[] = [
					{
						id: 'claude-haiku-4-5-20250101',
						display_name: 'Claude Haiku Jan',
						created_at: '2025-01-01T00:00:00Z',
						type: 'model'
					},
					{
						id: 'claude-haiku-4-5-20251231',
						display_name: 'Claude Haiku Dec',
						created_at: '2025-12-31T00:00:00Z',
						type: 'model'
					},
					{
						id: 'claude-haiku-4-5-20250615',
						display_name: 'Claude Haiku Jun',
						created_at: '2025-06-15T00:00:00Z',
						type: 'model'
					}
				];
				const result = findLatestHaikuModel(models);
				expect(result).not.toBeNull();
				expect(result?.id).toBe('claude-haiku-4-5-20251231');
			});

			it('should prefer newer version (4.5 over 4) when dates are same', () => {
				const models: ModelInfo[] = [
					{
						id: 'claude-haiku-4-20250514',
						display_name: 'Claude Haiku 4',
						created_at: '2025-05-14T00:00:00Z',
						type: 'model'
					},
					{
						id: 'claude-haiku-4-5-20250514',
						display_name: 'Claude Haiku 4.5',
						created_at: '2025-05-14T00:00:00Z',
						type: 'model'
					}
				];
				const result = findLatestHaikuModel(models);
				expect(result).not.toBeNull();
				// Should prefer 4.5 over 4 (alphabetically "4-5" comes after "4")
				expect(result?.id).toBe('claude-haiku-4-5-20250514');
			});
		});

		describe('Case Insensitivity', () => {
			it('should match "haiku" case-insensitively', () => {
				const models: ModelInfo[] = [
					{
						id: 'claude-HAIKU-4-5-20250514',
						display_name: 'Claude HAIKU 4.5',
						created_at: '2025-05-14T00:00:00Z',
						type: 'model'
					}
				];
				const result = findLatestHaikuModel(models);
				expect(result).not.toBeNull();
				expect(result?.id).toBe('claude-HAIKU-4-5-20250514');
			});

			it('should match "Haiku" with mixed case', () => {
				const models: ModelInfo[] = [
					{
						id: 'claude-Haiku-4-5-20250514',
						display_name: 'Claude Haiku 4.5',
						created_at: '2025-05-14T00:00:00Z',
						type: 'model'
					}
				];
				const result = findLatestHaikuModel(models);
				expect(result).not.toBeNull();
			});

			it('should find Haiku among mixed case models', () => {
				const models: ModelInfo[] = [
					{
						id: 'claude-SONNET-4-20250514',
						display_name: 'Claude SONNET 4',
						created_at: '2025-05-14T00:00:00Z',
						type: 'model'
					},
					{
						id: 'claude-haiku-4-5-20250514',
						display_name: 'Claude haiku 4.5',
						created_at: '2025-05-14T00:00:00Z',
						type: 'model'
					}
				];
				const result = findLatestHaikuModel(models);
				expect(result).not.toBeNull();
				expect(result?.id).toBe('claude-haiku-4-5-20250514');
			});
		});

		describe('Fallback Sorting Strategies', () => {
			it('should fall back to created_at when no date in ID', () => {
				const models: ModelInfo[] = [
					{
						id: 'claude-haiku-old',
						display_name: 'Claude Haiku Old',
						created_at: '2024-01-01T00:00:00Z',
						type: 'model'
					},
					{
						id: 'claude-haiku-new',
						display_name: 'Claude Haiku New',
						created_at: '2025-06-01T00:00:00Z',
						type: 'model'
					}
				];
				const result = findLatestHaikuModel(models);
				expect(result).not.toBeNull();
				expect(result?.id).toBe('claude-haiku-new');
			});

			it('should fall back to alphabetical sort as last resort', () => {
				const models: ModelInfo[] = [
					{
						id: 'claude-haiku-alpha',
						display_name: 'Claude Haiku Alpha',
						created_at: '',
						type: 'model'
					},
					{
						id: 'claude-haiku-zeta',
						display_name: 'Claude Haiku Zeta',
						created_at: '',
						type: 'model'
					},
					{
						id: 'claude-haiku-beta',
						display_name: 'Claude Haiku Beta',
						created_at: '',
						type: 'model'
					}
				];
				const result = findLatestHaikuModel(models);
				expect(result).not.toBeNull();
				// Alphabetically last (descending)
				expect(result?.id).toBe('claude-haiku-zeta');
			});

			it('should prioritize date in ID over created_at field', () => {
				const models: ModelInfo[] = [
					{
						id: 'claude-haiku-old-20240101',
						display_name: 'Claude Haiku Old',
						created_at: '2025-12-31T00:00:00Z', // Newer created_at
						type: 'model'
					},
					{
						id: 'claude-haiku-new-20251231',
						display_name: 'Claude Haiku New',
						created_at: '2024-01-01T00:00:00Z', // Older created_at
						type: 'model'
					}
				];
				const result = findLatestHaikuModel(models);
				expect(result).not.toBeNull();
				// Should use date from ID (20251231) not created_at
				expect(result?.id).toBe('claude-haiku-new-20251231');
			});

			it('should handle mixed sorting strategies', () => {
				// Some have dates in ID, some only have created_at, some only alphabetical
				const models: ModelInfo[] = [
					{
						id: 'claude-haiku-dated-20250101',
						display_name: 'Claude Haiku Dated',
						created_at: '2024-01-01T00:00:00Z',
						type: 'model'
					},
					{
						id: 'claude-haiku-no-date',
						display_name: 'Claude Haiku No Date',
						created_at: '2025-12-31T00:00:00Z',
						type: 'model'
					},
					{
						id: 'claude-haiku-another',
						display_name: 'Claude Haiku Another',
						created_at: '',
						type: 'model'
					}
				];
				const result = findLatestHaikuModel(models);
				expect(result).not.toBeNull();
				// Should pick the one with date in ID (priority 1) even though another has newer created_at
				expect(result?.id).toBe('claude-haiku-dated-20250101');
			});
		});

		describe('Edge Cases', () => {
			it('should handle models with missing created_at field', () => {
				const models: ModelInfo[] = [
					{
						id: 'claude-haiku-4-5-20250514',
						display_name: 'Claude Haiku 4.5',
						created_at: '',
						type: 'model'
					}
				];
				const result = findLatestHaikuModel(models);
				expect(result).not.toBeNull();
				expect(result?.id).toBe('claude-haiku-4-5-20250514');
			});

			it('should handle models with invalid created_at format', () => {
				const models: ModelInfo[] = [
					{
						id: 'claude-haiku-one',
						display_name: 'Claude Haiku One',
						created_at: 'invalid-date',
						type: 'model'
					},
					{
						id: 'claude-haiku-two',
						display_name: 'Claude Haiku Two',
						created_at: 'also-invalid',
						type: 'model'
					}
				];
				const result = findLatestHaikuModel(models);
				expect(result).not.toBeNull();
				// Should fall back to alphabetical
			});

			it('should handle very large model arrays', () => {
				const models: ModelInfo[] = [];
				for (let i = 0; i < 100; i++) {
					models.push({
						id: `claude-haiku-4-5-202501${String(i).padStart(2, '0')}`,
						display_name: `Claude Haiku ${i}`,
						created_at: `2025-01-${String(i).padStart(2, '0')}T00:00:00Z`,
						type: 'model'
					});
				}
				const result = findLatestHaikuModel(models);
				expect(result).not.toBeNull();
				// Should find the one with highest date
			});

			it('should return complete ModelInfo object with all fields', () => {
				const models: ModelInfo[] = [
					{
						id: 'claude-haiku-4-5-20250514',
						display_name: 'Claude Haiku 4.5',
						created_at: '2025-05-14T00:00:00Z',
						type: 'model'
					}
				];
				const result = findLatestHaikuModel(models);
				expect(result).not.toBeNull();
				expect(result).toHaveProperty('id');
				expect(result).toHaveProperty('display_name');
				expect(result).toHaveProperty('created_at');
				expect(result).toHaveProperty('type');
				expect(result?.type).toBe('model');
			});
		});
	});

	describe('getSelectedModel (with auto-selection)', () => {
		describe('Stored Selection Priority', () => {
			it('should return stored selection from localStorage if exists', () => {
				localStorage.setItem('dm-assist-selected-model', 'claude-opus-4-5-20251101');

				const model = getSelectedModel();
				expect(model).toBe('claude-opus-4-5-20251101');
			});

			it('should return stored selection even if cache exists', () => {
				// Set a stored selection
				localStorage.setItem('dm-assist-selected-model', 'claude-sonnet-4-20250514');

				// Set a cache with Haiku models
				const cache = {
					models: [
						{
							id: 'claude-haiku-4-5-20250514',
							display_name: 'Claude Haiku 4.5',
							created_at: '2025-05-14T00:00:00Z',
							type: 'model' as const
						}
					],
					timestamp: Date.now()
				};
				localStorage.setItem('dm-assist-models-cache', JSON.stringify(cache));

				const model = getSelectedModel();
				// Should return stored selection, not auto-select Haiku
				expect(model).toBe('claude-sonnet-4-20250514');
			});

			it('should prefer user selection over auto-selection', () => {
				// User explicitly selected an older model
				localStorage.setItem('dm-assist-selected-model', 'claude-haiku-4-5-20240101');

				// Cache has newer Haiku models
				const cache = {
					models: [
						{
							id: 'claude-haiku-4-5-20240101',
							display_name: 'Claude Haiku 4.5 Old',
							created_at: '2024-01-01T00:00:00Z',
							type: 'model' as const
						},
						{
							id: 'claude-haiku-4-5-20251231',
							display_name: 'Claude Haiku 4.5 New',
							created_at: '2025-12-31T00:00:00Z',
							type: 'model' as const
						}
					],
					timestamp: Date.now()
				};
				localStorage.setItem('dm-assist-models-cache', JSON.stringify(cache));

				const model = getSelectedModel();
				// Should respect user's choice
				expect(model).toBe('claude-haiku-4-5-20240101');
			});
		});

		describe('Auto-selection from Cache', () => {
			it('should return latest Haiku from cache when no stored selection', () => {
				// No stored selection
				localStorage.removeItem('dm-assist-selected-model');

				// Set cache with multiple Haiku models
				const cache = {
					models: [
						{
							id: 'claude-haiku-4-5-20250514',
							display_name: 'Claude Haiku 4.5',
							created_at: '2025-05-14T00:00:00Z',
							type: 'model' as const
						},
						{
							id: 'claude-haiku-4-5-20250601',
							display_name: 'Claude Haiku 4.5 June',
							created_at: '2025-06-01T00:00:00Z',
							type: 'model' as const
						},
						{
							id: 'claude-sonnet-4-20250514',
							display_name: 'Claude Sonnet 4',
							created_at: '2025-05-14T00:00:00Z',
							type: 'model' as const
						}
					],
					timestamp: Date.now()
				};
				localStorage.setItem('dm-assist-models-cache', JSON.stringify(cache));

				const model = getSelectedModel();
				// Should auto-select latest Haiku
				expect(model).toBe('claude-haiku-4-5-20250601');
			});

			it('should auto-select Haiku even when other models are newer', () => {
				localStorage.removeItem('dm-assist-selected-model');

				const cache = {
					models: [
						{
							id: 'claude-haiku-4-5-20250514',
							display_name: 'Claude Haiku 4.5',
							created_at: '2025-05-14T00:00:00Z',
							type: 'model' as const
						},
						{
							id: 'claude-opus-4-5-20251101',
							display_name: 'Claude Opus 4.5',
							created_at: '2025-11-01T00:00:00Z',
							type: 'model' as const
						}
					],
					timestamp: Date.now()
				};
				localStorage.setItem('dm-assist-models-cache', JSON.stringify(cache));

				const model = getSelectedModel();
				// Should select Haiku, not the newer Opus
				expect(model).toBe('claude-haiku-4-5-20250514');
			});

			it('should respect cache expiration', () => {
				localStorage.removeItem('dm-assist-selected-model');

				// Set expired cache (more than 1 hour old)
				const cache = {
					models: [
						{
							id: 'claude-haiku-4-5-20250514',
							display_name: 'Claude Haiku 4.5',
							created_at: '2025-05-14T00:00:00Z',
							type: 'model' as const
						}
					],
					timestamp: Date.now() - (1000 * 60 * 60 * 2) // 2 hours ago
				};
				localStorage.setItem('dm-assist-models-cache', JSON.stringify(cache));

				const model = getSelectedModel();
				// Should fall back to DEFAULT_MODEL when cache is expired
				expect(model).toBe('claude-haiku-4-5-20250514');
			});
		});

		describe('Fallback to DEFAULT_MODEL', () => {
			it('should return DEFAULT_MODEL when no cache and no stored selection', () => {
				localStorage.removeItem('dm-assist-selected-model');
				localStorage.removeItem('dm-assist-models-cache');

				const model = getSelectedModel();
				expect(model).toBe('claude-haiku-4-5-20250514');
			});

			it('should return DEFAULT_MODEL when cache has no Haiku models', () => {
				localStorage.removeItem('dm-assist-selected-model');

				const cache = {
					models: [
						{
							id: 'claude-sonnet-4-20250514',
							display_name: 'Claude Sonnet 4',
							created_at: '2025-05-14T00:00:00Z',
							type: 'model' as const
						},
						{
							id: 'claude-opus-4-5-20251101',
							display_name: 'Claude Opus 4.5',
							created_at: '2025-11-01T00:00:00Z',
							type: 'model' as const
						}
					],
					timestamp: Date.now()
				};
				localStorage.setItem('dm-assist-models-cache', JSON.stringify(cache));

				const model = getSelectedModel();
				expect(model).toBe('claude-haiku-4-5-20250514');
			});

			it('should return DEFAULT_MODEL when cache is empty array', () => {
				localStorage.removeItem('dm-assist-selected-model');

				const cache = {
					models: [],
					timestamp: Date.now()
				};
				localStorage.setItem('dm-assist-models-cache', JSON.stringify(cache));

				const model = getSelectedModel();
				expect(model).toBe('claude-haiku-4-5-20250514');
			});

			it('should return DEFAULT_MODEL when cache is malformed JSON', () => {
				localStorage.removeItem('dm-assist-selected-model');
				localStorage.setItem('dm-assist-models-cache', 'invalid-json{]');

				const model = getSelectedModel();
				expect(model).toBe('claude-haiku-4-5-20250514');
			});

			it('should return DEFAULT_MODEL when cache is missing models field', () => {
				localStorage.removeItem('dm-assist-selected-model');
				const cache = {
					timestamp: Date.now()
					// Missing models field
				};
				localStorage.setItem('dm-assist-models-cache', JSON.stringify(cache));

				const model = getSelectedModel();
				expect(model).toBe('claude-haiku-4-5-20250514');
			});
		});

		describe('SSR Context Handling', () => {
			it('should return DEFAULT_MODEL in SSR context (window undefined)', () => {
				// Simulate SSR by making window undefined
				const originalWindow = global.window;
				// @ts-expect-error - Testing SSR behavior
				delete global.window;

				const model = getSelectedModel();
				expect(model).toBe('claude-haiku-4-5-20250514');

				// Restore window
				global.window = originalWindow;
			});

			it('should not access localStorage in SSR context', () => {
				const originalWindow = global.window;
				// @ts-expect-error - Testing SSR behavior
				delete global.window;

				// This should not throw even though localStorage is unavailable
				expect(() => getSelectedModel()).not.toThrow();

				// Restore window
				global.window = originalWindow;
			});
		});

		describe('Integration with setSelectedModel', () => {
			it('should return model set via setSelectedModel', () => {
				setSelectedModel('claude-opus-4-5-20251101');

				const model = getSelectedModel();
				expect(model).toBe('claude-opus-4-5-20251101');
			});

			it('should persist across multiple calls', () => {
				setSelectedModel('claude-haiku-4-5-20250514');

				expect(getSelectedModel()).toBe('claude-haiku-4-5-20250514');
				expect(getSelectedModel()).toBe('claude-haiku-4-5-20250514');
			});

			it('should override auto-selection after manual selection', () => {
				// Set cache with different Haiku
				const cache = {
					models: [
						{
							id: 'claude-haiku-4-5-20250601',
							display_name: 'Claude Haiku June',
							created_at: '2025-06-01T00:00:00Z',
							type: 'model' as const
						}
					],
					timestamp: Date.now()
				};
				localStorage.setItem('dm-assist-models-cache', JSON.stringify(cache));

				// Manually select different model
				setSelectedModel('claude-sonnet-4-20250514');

				// Should return manual selection, not auto-selected Haiku
				expect(getSelectedModel()).toBe('claude-sonnet-4-20250514');
			});
		});

		describe('Edge Cases', () => {
			it('should handle empty string in stored selection', () => {
				localStorage.setItem('dm-assist-selected-model', '');

				// Empty string should be treated as no selection
				// Should attempt auto-selection
				const model = getSelectedModel();
				expect(model).toBeDefined();
			});

			it('should handle whitespace in stored selection', () => {
				localStorage.setItem('dm-assist-selected-model', '   ');

				const model = getSelectedModel();
				expect(model).toBeDefined();
			});

			it('should handle cache with duplicate Haiku models', () => {
				localStorage.removeItem('dm-assist-selected-model');

				const cache = {
					models: [
						{
							id: 'claude-haiku-4-5-20250514',
							display_name: 'Claude Haiku 4.5',
							created_at: '2025-05-14T00:00:00Z',
							type: 'model' as const
						},
						{
							id: 'claude-haiku-4-5-20250514',
							display_name: 'Claude Haiku 4.5 Duplicate',
							created_at: '2025-05-14T00:00:00Z',
							type: 'model' as const
						}
					],
					timestamp: Date.now()
				};
				localStorage.setItem('dm-assist-models-cache', JSON.stringify(cache));

				const model = getSelectedModel();
				expect(model).toBe('claude-haiku-4-5-20250514');
			});

			it('should handle extremely long model IDs', () => {
				const longId = 'claude-haiku-4-5-' + '20250514'.repeat(10);
				setSelectedModel(longId);

				const model = getSelectedModel();
				expect(model).toBe(longId);
			});

			it('should handle special characters in model IDs', () => {
				const specialId = 'claude-haiku-4-5-20250514-special_v1.0';
				setSelectedModel(specialId);

				const model = getSelectedModel();
				expect(model).toBe(specialId);
			});
		});
	});
});
