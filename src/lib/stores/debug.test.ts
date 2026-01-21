/**
 * Tests for Debug Store (TDD RED Phase)
 *
 * Issue #118: Add debug console for AI request/response inspection
 *
 * This Svelte 5 runes-based store manages debug console state and entries.
 *
 * Covers:
 * - Initialization with default values
 * - load() loads enabled state from localStorage
 * - setEnabled() updates state and persists
 * - addEntry() adds entry to array
 * - addEntry() respects max limit (50 entries), removes oldest
 * - clearEntries() empties the array
 * - toggleExpanded() toggles expanded state
 *
 * NOTE: These tests are expected to FAIL initially (RED phase).
 * Implementation will be added in the GREEN phase to make them pass.
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import type { DebugEntry } from '$lib/types/debug';

// Mock the debug settings service
vi.mock('$lib/services/debugSettingsService', () => ({
	isDebugEnabled: vi.fn(() => false),
	setDebugEnabled: vi.fn()
}));

import { isDebugEnabled, setDebugEnabled } from '$lib/services/debugSettingsService';

describe('Debug Store', () => {
	let debugStore: any;
	let mockDebugEntry: DebugEntry;

	beforeEach(async () => {
		vi.clearAllMocks();

		// Clear module cache to get fresh store instance
		vi.resetModules();

		// Reset mock implementations
		vi.mocked(isDebugEnabled).mockReturnValue(false);
		vi.mocked(setDebugEnabled).mockImplementation(() => {});

		// Create mock debug entry
		mockDebugEntry = {
			id: 'debug-1',
			timestamp: new Date('2025-01-20T10:00:00Z'),
			type: 'request',
			request: {
				userMessage: 'Test message',
				systemPrompt: 'Test system prompt',
				contextData: {
					entityCount: 2,
					entities: [
						{ id: 'e1', type: 'character', name: 'Test Character', summaryLength: 100 },
						{ id: 'e2', type: 'location', name: 'Test Location', summaryLength: 150 }
					],
					totalCharacters: 250,
					truncated: false
				},
				model: 'claude-3-5-sonnet-20241022',
				maxTokens: 4096,
				conversationHistory: [
					{ role: 'user', content: 'Previous message' },
					{ role: 'assistant', content: 'Previous response' }
				]
			}
		};

		// Dynamically import the store to get a fresh instance
		const module = await import('./debug.svelte');
		debugStore = module.debugStore;
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	describe('Store Structure', () => {
		it('should expose enabled state', () => {
			expect(debugStore).toHaveProperty('enabled');
		});

		it('should expose entries array', () => {
			expect(debugStore).toHaveProperty('entries');
		});

		it('should expose isExpanded state', () => {
			expect(debugStore).toHaveProperty('isExpanded');
		});

		it('should expose load method', () => {
			expect(typeof debugStore.load).toBe('function');
		});

		it('should expose setEnabled method', () => {
			expect(typeof debugStore.setEnabled).toBe('function');
		});

		it('should expose addEntry method', () => {
			expect(typeof debugStore.addEntry).toBe('function');
		});

		it('should expose clearEntries method', () => {
			expect(typeof debugStore.clearEntries).toBe('function');
		});

		it('should expose toggleExpanded method', () => {
			expect(typeof debugStore.toggleExpanded).toBe('function');
		});
	});

	describe('Initial State', () => {
		it('should initialize with enabled=false', () => {
			expect(debugStore.enabled).toBe(false);
		});

		it('should initialize with empty entries array', () => {
			expect(debugStore.entries).toEqual([]);
			expect(debugStore.entries).toHaveLength(0);
		});

		it('should initialize with isExpanded=false', () => {
			expect(debugStore.isExpanded).toBe(false);
		});
	});

	describe('load', () => {
		it('should load enabled state from debugSettingsService', () => {
			vi.mocked(isDebugEnabled).mockReturnValue(true);

			debugStore.load();

			expect(isDebugEnabled).toHaveBeenCalled();
			expect(debugStore.enabled).toBe(true);
		});

		it('should set enabled to false when debugSettingsService returns false', () => {
			vi.mocked(isDebugEnabled).mockReturnValue(false);

			debugStore.load();

			expect(debugStore.enabled).toBe(false);
		});

		it('should not throw on error', () => {
			vi.mocked(isDebugEnabled).mockImplementation(() => {
				throw new Error('localStorage error');
			});

			expect(() => debugStore.load()).not.toThrow();
		});
	});

	describe('setEnabled', () => {
		it('should update enabled state to true', () => {
			debugStore.setEnabled(true);

			expect(debugStore.enabled).toBe(true);
		});

		it('should update enabled state to false', () => {
			debugStore.setEnabled(false);

			expect(debugStore.enabled).toBe(false);
		});

		it('should call setDebugEnabled service with true', () => {
			debugStore.setEnabled(true);

			expect(setDebugEnabled).toHaveBeenCalledWith(true);
		});

		it('should call setDebugEnabled service with false', () => {
			debugStore.setEnabled(false);

			expect(setDebugEnabled).toHaveBeenCalledWith(false);
		});

		it('should support toggling enabled state', () => {
			debugStore.setEnabled(true);
			expect(debugStore.enabled).toBe(true);

			debugStore.setEnabled(false);
			expect(debugStore.enabled).toBe(false);

			debugStore.setEnabled(true);
			expect(debugStore.enabled).toBe(true);
		});

		it('should persist state via service', () => {
			debugStore.setEnabled(true);

			expect(setDebugEnabled).toHaveBeenCalledTimes(1);
			expect(setDebugEnabled).toHaveBeenCalledWith(true);
		});
	});

	describe('addEntry', () => {
		describe('Basic Entry Addition', () => {
			it('should add entry to entries array', () => {
				debugStore.addEntry(mockDebugEntry);

				expect(debugStore.entries).toHaveLength(1);
				expect(debugStore.entries[0]).toEqual(mockDebugEntry);
			});

			it('should add multiple entries', () => {
				const entry1 = { ...mockDebugEntry, id: 'debug-1' };
				const entry2 = { ...mockDebugEntry, id: 'debug-2' };
				const entry3 = { ...mockDebugEntry, id: 'debug-3' };

				debugStore.addEntry(entry1);
				debugStore.addEntry(entry2);
				debugStore.addEntry(entry3);

				expect(debugStore.entries).toHaveLength(3);
			});

			it('should preserve order of entries (newest first)', () => {
				const entry1 = { ...mockDebugEntry, id: 'debug-1', timestamp: new Date('2025-01-20T10:00:00Z') };
				const entry2 = { ...mockDebugEntry, id: 'debug-2', timestamp: new Date('2025-01-20T10:01:00Z') };
				const entry3 = { ...mockDebugEntry, id: 'debug-3', timestamp: new Date('2025-01-20T10:02:00Z') };

				debugStore.addEntry(entry1);
				debugStore.addEntry(entry2);
				debugStore.addEntry(entry3);

				// Newest should be first
				expect(debugStore.entries[0].id).toBe('debug-3');
				expect(debugStore.entries[1].id).toBe('debug-2');
				expect(debugStore.entries[2].id).toBe('debug-1');
			});

			it('should handle request type entries', () => {
				const requestEntry: DebugEntry = {
					id: 'req-1',
					timestamp: new Date(),
					type: 'request',
					request: {
						userMessage: 'Test',
						systemPrompt: 'System',
						contextData: {
							entityCount: 0,
							entities: [],
							totalCharacters: 0,
							truncated: false
						},
						model: 'claude-3-5-sonnet-20241022',
						maxTokens: 4096,
						conversationHistory: []
					}
				};

				debugStore.addEntry(requestEntry);

				expect(debugStore.entries[0].type).toBe('request');
				expect(debugStore.entries[0].request).toBeDefined();
			});

			it('should handle response type entries', () => {
				const responseEntry: DebugEntry = {
					id: 'res-1',
					timestamp: new Date(),
					type: 'response',
					response: {
						content: 'Test response',
						tokenUsage: {
							promptTokens: 100,
							completionTokens: 50,
							totalTokens: 150
						},
						durationMs: 1500
					}
				};

				debugStore.addEntry(responseEntry);

				expect(debugStore.entries[0].type).toBe('response');
				expect(debugStore.entries[0].response).toBeDefined();
			});

			it('should handle error type entries', () => {
				const errorEntry: DebugEntry = {
					id: 'err-1',
					timestamp: new Date(),
					type: 'error',
					error: {
						message: 'API error occurred',
						status: 429
					}
				};

				debugStore.addEntry(errorEntry);

				expect(debugStore.entries[0].type).toBe('error');
				expect(debugStore.entries[0].error).toBeDefined();
			});
		});

		describe('Max Limit Enforcement (50 entries)', () => {
			it('should maintain max 50 entries', () => {
				// Add 60 entries
				for (let i = 0; i < 60; i++) {
					debugStore.addEntry({
						...mockDebugEntry,
						id: `debug-${i}`,
						timestamp: new Date(`2025-01-20T10:${String(i).padStart(2, '0')}:00Z`)
					});
				}

				expect(debugStore.entries).toHaveLength(50);
			});

			it('should remove oldest entries when limit is exceeded', () => {
				// Add 51 entries
				for (let i = 0; i < 51; i++) {
					debugStore.addEntry({
						...mockDebugEntry,
						id: `debug-${i}`,
						timestamp: new Date(`2025-01-20T${String(10 + Math.floor(i / 60)).padStart(2, '0')}:${String(i % 60).padStart(2, '0')}:00Z`)
					});
				}

				// Should have 50 entries
				expect(debugStore.entries).toHaveLength(50);

				// Oldest entry (debug-0) should be removed
				expect(debugStore.entries.find((e: DebugEntry) => e.id === 'debug-0')).toBeUndefined();

				// Newest entry (debug-50) should be present
				expect(debugStore.entries[0].id).toBe('debug-50');
			});

			it('should keep the 50 most recent entries', () => {
				// Add 100 entries
				for (let i = 0; i < 100; i++) {
					debugStore.addEntry({
						...mockDebugEntry,
						id: `debug-${i}`
					});
				}

				expect(debugStore.entries).toHaveLength(50);

				// Should contain debug-50 through debug-99
				expect(debugStore.entries[0].id).toBe('debug-99'); // newest
				expect(debugStore.entries[49].id).toBe('debug-50'); // oldest kept
			});

			it('should allow adding entries after hitting limit', () => {
				// Fill to limit
				for (let i = 0; i < 50; i++) {
					debugStore.addEntry({
						...mockDebugEntry,
						id: `debug-${i}`
					});
				}

				// Add one more
				const newEntry = { ...mockDebugEntry, id: 'debug-new' };
				debugStore.addEntry(newEntry);

				expect(debugStore.entries).toHaveLength(50);
				expect(debugStore.entries[0].id).toBe('debug-new');
			});
		});
	});

	describe('clearEntries', () => {
		it('should clear all entries', () => {
			// Add some entries
			debugStore.addEntry(mockDebugEntry);
			debugStore.addEntry({ ...mockDebugEntry, id: 'debug-2' });
			debugStore.addEntry({ ...mockDebugEntry, id: 'debug-3' });

			expect(debugStore.entries).toHaveLength(3);

			debugStore.clearEntries();

			expect(debugStore.entries).toEqual([]);
			expect(debugStore.entries).toHaveLength(0);
		});

		it('should not throw when clearing empty entries', () => {
			expect(() => debugStore.clearEntries()).not.toThrow();
			expect(debugStore.entries).toEqual([]);
		});

		it('should allow adding entries after clearing', () => {
			// Add and clear
			debugStore.addEntry(mockDebugEntry);
			debugStore.clearEntries();

			// Add again
			const newEntry = { ...mockDebugEntry, id: 'new-entry' };
			debugStore.addEntry(newEntry);

			expect(debugStore.entries).toHaveLength(1);
			expect(debugStore.entries[0].id).toBe('new-entry');
		});

		it('should not affect enabled state', () => {
			debugStore.setEnabled(true);
			debugStore.clearEntries();

			expect(debugStore.enabled).toBe(true);
		});

		it('should not affect expanded state', () => {
			debugStore.toggleExpanded();
			debugStore.clearEntries();

			expect(debugStore.isExpanded).toBe(true);
		});
	});

	describe('toggleExpanded', () => {
		it('should toggle isExpanded from false to true', () => {
			expect(debugStore.isExpanded).toBe(false);

			debugStore.toggleExpanded();

			expect(debugStore.isExpanded).toBe(true);
		});

		it('should toggle isExpanded from true to false', () => {
			debugStore.toggleExpanded(); // Set to true
			expect(debugStore.isExpanded).toBe(true);

			debugStore.toggleExpanded(); // Toggle back

			expect(debugStore.isExpanded).toBe(false);
		});

		it('should support multiple toggles', () => {
			expect(debugStore.isExpanded).toBe(false);

			debugStore.toggleExpanded();
			expect(debugStore.isExpanded).toBe(true);

			debugStore.toggleExpanded();
			expect(debugStore.isExpanded).toBe(false);

			debugStore.toggleExpanded();
			expect(debugStore.isExpanded).toBe(true);
		});

		it('should not affect enabled state', () => {
			debugStore.setEnabled(true);
			debugStore.toggleExpanded();

			expect(debugStore.enabled).toBe(true);
		});

		it('should not affect entries', () => {
			debugStore.addEntry(mockDebugEntry);
			debugStore.toggleExpanded();

			expect(debugStore.entries).toHaveLength(1);
		});
	});

	describe('Integration Tests', () => {
		it('should support complete workflow: load, enable, add entries, clear', () => {
			// Load
			vi.mocked(isDebugEnabled).mockReturnValue(true);
			debugStore.load();
			expect(debugStore.enabled).toBe(true);

			// Add entries
			debugStore.addEntry(mockDebugEntry);
			debugStore.addEntry({ ...mockDebugEntry, id: 'debug-2' });
			expect(debugStore.entries).toHaveLength(2);

			// Clear
			debugStore.clearEntries();
			expect(debugStore.entries).toHaveLength(0);

			// Disable
			debugStore.setEnabled(false);
			expect(debugStore.enabled).toBe(false);
		});

		it('should maintain state independence', () => {
			// Set all states
			debugStore.setEnabled(true);
			debugStore.toggleExpanded();
			debugStore.addEntry(mockDebugEntry);

			// Verify all are independent
			expect(debugStore.enabled).toBe(true);
			expect(debugStore.isExpanded).toBe(true);
			expect(debugStore.entries).toHaveLength(1);

			// Clear entries shouldn't affect others
			debugStore.clearEntries();
			expect(debugStore.enabled).toBe(true);
			expect(debugStore.isExpanded).toBe(true);
			expect(debugStore.entries).toHaveLength(0);
		});
	});

	describe('Edge Cases', () => {
		it('should handle entries with minimal data', () => {
			const minimalEntry: DebugEntry = {
				id: 'min-1',
				timestamp: new Date(),
				type: 'error',
				error: {
					message: 'Error'
				}
			};

			debugStore.addEntry(minimalEntry);

			expect(debugStore.entries[0]).toEqual(minimalEntry);
		});

		it('should handle entries with all optional fields', () => {
			const fullEntry: DebugEntry = {
				id: 'full-1',
				timestamp: new Date(),
				type: 'request',
				request: {
					userMessage: 'Test',
					systemPrompt: 'System',
					contextData: {
						entityCount: 1,
						entities: [{ id: 'e1', type: 'character', name: 'Test', summaryLength: 100 }],
						totalCharacters: 100,
						truncated: true,
						generationType: 'custom',
						typeFieldValues: { field1: 'value1' }
					},
					model: 'claude-3-5-sonnet-20241022',
					maxTokens: 4096,
					conversationHistory: [{ role: 'user', content: 'Test' }]
				}
			};

			debugStore.addEntry(fullEntry);

			expect(debugStore.entries[0]).toEqual(fullEntry);
		});

		it('should handle concurrent operations', () => {
			debugStore.setEnabled(true);
			debugStore.toggleExpanded();

			const entry1 = { ...mockDebugEntry, id: 'concurrent-1' };
			const entry2 = { ...mockDebugEntry, id: 'concurrent-2' };

			debugStore.addEntry(entry1);
			debugStore.addEntry(entry2);

			expect(debugStore.entries).toHaveLength(2);
			expect(debugStore.enabled).toBe(true);
			expect(debugStore.isExpanded).toBe(true);
		});
	});
});
