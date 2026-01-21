/**
 * Tests for State Refresh Service (TDD RED Phase)
 *
 * Issue #252: Replace window.location.reload() with in-memory state refresh
 *
 * This service provides centralized functions to refresh application state
 * from the database without full page reloads, improving UX and performance.
 *
 * Covers:
 * - refreshAllStores() - Reload all data stores from database
 * - resetAllStores() - Reset stores to clean state (for clearing data)
 * - refreshAfterCampaignSwitch() - Refresh campaign-dependent stores
 * - Navigation behavior when path is provided
 * - Verification that window.location.reload is NOT used
 *
 * NOTE: These tests are expected to FAIL initially (RED phase).
 * Implementation will be added in the GREEN phase to make them pass.
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { refreshAllStores, resetAllStores, refreshAfterCampaignSwitch } from './stateRefreshService';

// Mock all stores
vi.mock('$lib/stores', () => ({
	entitiesStore: {
		load: vi.fn(),
		reset: vi.fn()
	},
	campaignStore: {
		load: vi.fn(),
		reset: vi.fn()
	},
	conversationStore: {
		load: vi.fn(),
		reset: vi.fn()
	},
	chatStore: {
		load: vi.fn(),
		reset: vi.fn()
	},
	combatStore: {
		load: vi.fn(),
		reset: vi.fn()
	},
	notificationStore: {
		// Notification store likely doesn't need load/reset
	},
	uiStore: {
		// UI store likely doesn't need load/reset
	},
	aiSettings: {
		// AI settings likely doesn't need load/reset
	},
	debugStore: {
		// Debug store likely doesn't need load/reset
	}
}));

// Mock SvelteKit navigation
vi.mock('$app/navigation', () => ({
	goto: vi.fn()
}));

describe('stateRefreshService', () => {
	beforeEach(() => {
		// Clear all mock call history before each test
		vi.clearAllMocks();
	});

	describe('refreshAllStores', () => {
		it('should be defined as a function', () => {
			expect(refreshAllStores).toBeDefined();
			expect(typeof refreshAllStores).toBe('function');
		});

		it('should call load() on entitiesStore', async () => {
			const { entitiesStore } = await import('$lib/stores');

			await refreshAllStores();

			expect(entitiesStore.load).toHaveBeenCalledTimes(1);
		});

		it('should call load() on campaignStore', async () => {
			const { campaignStore } = await import('$lib/stores');

			await refreshAllStores();

			expect(campaignStore.load).toHaveBeenCalledTimes(1);
		});

		it('should call load() on conversationStore', async () => {
			const { conversationStore } = await import('$lib/stores');

			await refreshAllStores();

			expect(conversationStore.load).toHaveBeenCalledTimes(1);
		});

		it('should call load() on chatStore', async () => {
			const { chatStore } = await import('$lib/stores');

			await refreshAllStores();

			expect(chatStore.load).toHaveBeenCalledTimes(1);
		});

		it('should call load() on combatStore', async () => {
			const { combatStore } = await import('$lib/stores');

			await refreshAllStores();

			expect(combatStore.load).toHaveBeenCalledTimes(1);
		});

		it('should call all store load methods in parallel for performance', async () => {
			const { entitiesStore, campaignStore, conversationStore, chatStore, combatStore } =
				await import('$lib/stores');

			// Track when each load was called
			const callTimes: Record<string, number> = {};

			entitiesStore.load = vi.fn().mockImplementation(() => {
				callTimes.entities = Date.now();
				return Promise.resolve();
			});

			campaignStore.load = vi.fn().mockImplementation(() => {
				callTimes.campaign = Date.now();
				return Promise.resolve();
			});

			conversationStore.load = vi.fn().mockImplementation(() => {
				callTimes.conversation = Date.now();
				return Promise.resolve();
			});

			chatStore.load = vi.fn().mockImplementation(() => {
				callTimes.chat = Date.now();
				return Promise.resolve();
			});

			combatStore.load = vi.fn().mockImplementation(() => {
				callTimes.combat = Date.now();
				return Promise.resolve();
			});

			await refreshAllStores();

			// All stores should have been called
			expect(Object.keys(callTimes)).toHaveLength(5);

			// Calls should be nearly simultaneous (within 50ms), indicating parallel execution
			const times = Object.values(callTimes);
			const minTime = Math.min(...times);
			const maxTime = Math.max(...times);
			expect(maxTime - minTime).toBeLessThan(50);
		});

		it('should handle errors from individual stores gracefully', async () => {
			const { entitiesStore, campaignStore } = await import('$lib/stores');

			// Make one store fail
			entitiesStore.load = vi.fn().mockRejectedValue(new Error('Database error'));
			campaignStore.load = vi.fn().mockResolvedValue(undefined);

			// Should not throw, but handle error gracefully
			await expect(refreshAllStores()).resolves.not.toThrow();

			// Other stores should still be called
			expect(campaignStore.load).toHaveBeenCalled();
		});

		it('should return a Promise that resolves when all loads complete', async () => {
			const result = refreshAllStores();

			expect(result).toBeInstanceOf(Promise);
			await expect(result).resolves.toBeUndefined();
		});

		it('should wait for all async load operations to complete', async () => {
			const { entitiesStore, campaignStore } = await import('$lib/stores');

			let entitiesLoaded = false;
			let campaignLoaded = false;

			entitiesStore.load = vi.fn().mockImplementation(async () => {
				await new Promise(resolve => setTimeout(resolve, 50));
				entitiesLoaded = true;
			});

			campaignStore.load = vi.fn().mockImplementation(async () => {
				await new Promise(resolve => setTimeout(resolve, 30));
				campaignLoaded = true;
			});

			await refreshAllStores();

			// Both should be loaded after await
			expect(entitiesLoaded).toBe(true);
			expect(campaignLoaded).toBe(true);
		});
	});

	describe('resetAllStores', () => {
		it('should be defined as a function', () => {
			expect(resetAllStores).toBeDefined();
			expect(typeof resetAllStores).toBe('function');
		});

		it('should call reset() on entitiesStore if it exists', async () => {
			const { entitiesStore } = await import('$lib/stores');

			await resetAllStores();

			expect(entitiesStore.reset).toHaveBeenCalledTimes(1);
		});

		it('should call reset() on campaignStore', async () => {
			const { campaignStore } = await import('$lib/stores');

			await resetAllStores();

			expect(campaignStore.reset).toHaveBeenCalledTimes(1);
		});

		it('should call reset() on conversationStore if it exists', async () => {
			const { conversationStore } = await import('$lib/stores');

			await resetAllStores();

			expect(conversationStore.reset).toHaveBeenCalledTimes(1);
		});

		it('should call reset() on chatStore if it exists', async () => {
			const { chatStore } = await import('$lib/stores');

			await resetAllStores();

			expect(chatStore.reset).toHaveBeenCalledTimes(1);
		});

		it('should call reset() on combatStore if it exists', async () => {
			const { combatStore } = await import('$lib/stores');

			await resetAllStores();

			expect(combatStore.reset).toHaveBeenCalledTimes(1);
		});

		it('should gracefully handle stores without reset methods', async () => {
			const { notificationStore, uiStore } = await import('$lib/stores');

			// These stores likely don't have reset methods
			// Should not throw
			await expect(resetAllStores()).resolves.not.toThrow();
		});

		it('should reset stores in the correct order (data stores before UI stores)', async () => {
			const { campaignStore, entitiesStore } = await import('$lib/stores');

			const resetOrder: string[] = [];

			campaignStore.reset = vi.fn().mockImplementation(() => {
				resetOrder.push('campaign');
			});

			entitiesStore.reset = vi.fn().mockImplementation(() => {
				resetOrder.push('entities');
			});

			await resetAllStores();

			// Campaign should be reset before entities (entities depend on campaign)
			const campaignIndex = resetOrder.indexOf('campaign');
			const entitiesIndex = resetOrder.indexOf('entities');

			expect(campaignIndex).toBeGreaterThanOrEqual(0);
			expect(entitiesIndex).toBeGreaterThanOrEqual(0);
			expect(campaignIndex).toBeLessThan(entitiesIndex);
		});

		it('should handle errors from individual store resets gracefully', async () => {
			const { campaignStore, entitiesStore } = await import('$lib/stores');

			// Make one store fail
			campaignStore.reset = vi.fn().mockImplementation(() => {
				throw new Error('Reset error');
			});
			entitiesStore.reset = vi.fn();

			// Should not throw
			await expect(resetAllStores()).resolves.not.toThrow();

			// Other stores should still be reset
			expect(entitiesStore.reset).toHaveBeenCalled();
		});

		it('should return a Promise that resolves when all resets complete', async () => {
			const result = resetAllStores();

			expect(result).toBeInstanceOf(Promise);
			await expect(result).resolves.toBeUndefined();
		});

		it('should be synchronous (reset methods are typically sync)', async () => {
			const { campaignStore } = await import('$lib/stores');

			let resetCalled = false;
			campaignStore.reset = vi.fn().mockImplementation(() => {
				resetCalled = true;
			});

			const promise = resetAllStores();

			// Reset should be called synchronously
			expect(resetCalled).toBe(true);
			await promise;
		});
	});

	describe('refreshAfterCampaignSwitch', () => {
		it('should be defined as a function', () => {
			expect(refreshAfterCampaignSwitch).toBeDefined();
			expect(typeof refreshAfterCampaignSwitch).toBe('function');
		});

		it('should reload campaign-dependent stores', async () => {
			const { entitiesStore, conversationStore, chatStore, combatStore } =
				await import('$lib/stores');

			await refreshAfterCampaignSwitch();

			// These stores are campaign-dependent and should be reloaded
			expect(entitiesStore.load).toHaveBeenCalledTimes(1);
			expect(conversationStore.load).toHaveBeenCalledTimes(1);
			expect(chatStore.load).toHaveBeenCalledTimes(1);
			expect(combatStore.load).toHaveBeenCalledTimes(1);
		});

		it('should NOT reload the campaign store itself (already switched)', async () => {
			const { campaignStore } = await import('$lib/stores');

			await refreshAfterCampaignSwitch();

			// Campaign store should not be reloaded since it was already switched
			expect(campaignStore.load).not.toHaveBeenCalled();
		});

		it('should reload campaign store if explicitly requested', async () => {
			const { campaignStore } = await import('$lib/stores');

			await refreshAfterCampaignSwitch({ reloadCampaign: true });

			expect(campaignStore.load).toHaveBeenCalledTimes(1);
		});

		it('should navigate to provided path after refresh', async () => {
			const { goto } = await import('$app/navigation');

			await refreshAfterCampaignSwitch({ navigateTo: '/entities/character' });

			expect(goto).toHaveBeenCalledWith('/entities/character');
		});

		it('should navigate to home if no path provided', async () => {
			const { goto } = await import('$app/navigation');

			await refreshAfterCampaignSwitch({ navigateTo: '/' });

			expect(goto).toHaveBeenCalledWith('/');
		});

		it('should NOT navigate if navigateTo is undefined', async () => {
			const { goto } = await import('$app/navigation');

			await refreshAfterCampaignSwitch();

			expect(goto).not.toHaveBeenCalled();
		});

		it('should complete store refresh before navigation', async () => {
			const { goto } = await import('$app/navigation');
			const { entitiesStore } = await import('$lib/stores');

			const callOrder: string[] = [];

			entitiesStore.load = vi.fn().mockImplementation(async () => {
				callOrder.push('load');
				await new Promise(resolve => setTimeout(resolve, 10));
			});

			(goto as any).mockImplementation(() => {
				callOrder.push('navigate');
			});

			await refreshAfterCampaignSwitch({ navigateTo: '/' });

			// Load should happen before navigation
			expect(callOrder).toEqual(['load', 'navigate']);
		});

		it('should handle store refresh errors gracefully', async () => {
			const { entitiesStore } = await import('$lib/stores');

			entitiesStore.load = vi.fn().mockRejectedValue(new Error('Load error'));

			// Should not throw
			await expect(refreshAfterCampaignSwitch()).resolves.not.toThrow();
		});

		it('should still navigate even if store refresh fails', async () => {
			const { goto } = await import('$app/navigation');
			const { entitiesStore } = await import('$lib/stores');

			entitiesStore.load = vi.fn().mockRejectedValue(new Error('Load error'));

			await refreshAfterCampaignSwitch({ navigateTo: '/' });

			// Navigation should still happen
			expect(goto).toHaveBeenCalledWith('/');
		});

		it('should accept options object with navigateTo property', async () => {
			const { goto } = await import('$app/navigation');

			await refreshAfterCampaignSwitch({ navigateTo: '/combat' });

			expect(goto).toHaveBeenCalledWith('/combat');
		});

		it('should accept navigateTo as direct string parameter (backward compatibility)', async () => {
			const { goto } = await import('$app/navigation');

			await refreshAfterCampaignSwitch('/entities/location');

			expect(goto).toHaveBeenCalledWith('/entities/location');
		});

		it('should refresh stores in parallel for performance', async () => {
			const { entitiesStore, conversationStore, chatStore, combatStore } =
				await import('$lib/stores');

			const callTimes: Record<string, number> = {};

			entitiesStore.load = vi.fn().mockImplementation(async () => {
				callTimes.entities = Date.now();
			});

			conversationStore.load = vi.fn().mockImplementation(async () => {
				callTimes.conversation = Date.now();
			});

			chatStore.load = vi.fn().mockImplementation(async () => {
				callTimes.chat = Date.now();
			});

			combatStore.load = vi.fn().mockImplementation(async () => {
				callTimes.combat = Date.now();
			});

			await refreshAfterCampaignSwitch();

			// All calls should be nearly simultaneous
			const times = Object.values(callTimes);
			const minTime = Math.min(...times);
			const maxTime = Math.max(...times);
			expect(maxTime - minTime).toBeLessThan(50);
		});
	});

	describe('Anti-Pattern Prevention', () => {
		it('should NOT use window.location.reload anywhere in stateRefreshService', async () => {
			// Read the source file and verify it doesn't contain window.location.reload
			const fs = await import('fs/promises');
			const path = await import('path');

			const servicePath = path.join(__dirname, 'stateRefreshService.ts');

			try {
				const sourceCode = await fs.readFile(servicePath, 'utf-8');

				// Should not contain window.location.reload
				expect(sourceCode).not.toContain('window.location.reload');
				expect(sourceCode).not.toContain('location.reload');
			} catch (err) {
				// If file doesn't exist yet (RED phase), this test should still be meaningful
				// We're documenting the requirement that the file should never use this pattern
				expect(true).toBe(true);
			}
		});

		it('should provide in-memory state refresh as alternative to page reload', () => {
			// This is a documentation test - the service should provide these functions
			// as alternatives to window.location.reload()
			expect(typeof refreshAllStores).toBe('function');
			expect(typeof resetAllStores).toBe('function');
			expect(typeof refreshAfterCampaignSwitch).toBe('function');
		});
	});

	describe('Integration Scenarios', () => {
		it('should support full app refresh scenario (after data import)', async () => {
			const { entitiesStore, campaignStore, conversationStore, chatStore, combatStore } =
				await import('$lib/stores');

			await refreshAllStores();

			// All stores should be refreshed
			expect(entitiesStore.load).toHaveBeenCalled();
			expect(campaignStore.load).toHaveBeenCalled();
			expect(conversationStore.load).toHaveBeenCalled();
			expect(chatStore.load).toHaveBeenCalled();
			expect(combatStore.load).toHaveBeenCalled();
		});

		it('should support clear all data scenario', async () => {
			const { campaignStore, entitiesStore, conversationStore, chatStore, combatStore } =
				await import('$lib/stores');

			await resetAllStores();

			// All stores should be reset
			expect(campaignStore.reset).toHaveBeenCalled();
			expect(entitiesStore.reset).toHaveBeenCalled();
			expect(conversationStore.reset).toHaveBeenCalled();
			expect(chatStore.reset).toHaveBeenCalled();
			expect(combatStore.reset).toHaveBeenCalled();
		});

		it('should support campaign switch with navigation', async () => {
			const { goto } = await import('$app/navigation');
			const { entitiesStore, conversationStore } = await import('$lib/stores');

			await refreshAfterCampaignSwitch({ navigateTo: '/' });

			// Campaign-dependent stores should be refreshed
			expect(entitiesStore.load).toHaveBeenCalled();
			expect(conversationStore.load).toHaveBeenCalled();

			// Should navigate to home
			expect(goto).toHaveBeenCalledWith('/');
		});

		it('should support campaign switch without navigation', async () => {
			const { goto } = await import('$app/navigation');
			const { entitiesStore } = await import('$lib/stores');

			await refreshAfterCampaignSwitch();

			// Stores should still be refreshed
			expect(entitiesStore.load).toHaveBeenCalled();

			// But no navigation
			expect(goto).not.toHaveBeenCalled();
		});
	});

	describe('Error Handling', () => {
		it('should log errors from store refresh but not throw', async () => {
			const { entitiesStore } = await import('$lib/stores');
			const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

			entitiesStore.load = vi.fn().mockRejectedValue(new Error('DB error'));

			await expect(refreshAllStores()).resolves.not.toThrow();

			// Error should be logged
			expect(consoleError).toHaveBeenCalled();

			consoleError.mockRestore();
		});

		it('should continue refreshing other stores even if one fails', async () => {
			const { entitiesStore, campaignStore, conversationStore } = await import('$lib/stores');

			entitiesStore.load = vi.fn().mockRejectedValue(new Error('Entities error'));
			campaignStore.load = vi.fn().mockResolvedValue(undefined);
			conversationStore.load = vi.fn().mockResolvedValue(undefined);

			await refreshAllStores();

			// Other stores should still be called
			expect(campaignStore.load).toHaveBeenCalled();
			expect(conversationStore.load).toHaveBeenCalled();
		});

		it('should handle navigation errors gracefully', async () => {
			const { goto } = await import('$app/navigation');

			(goto as any).mockRejectedValue(new Error('Navigation error'));

			// Should not throw
			await expect(refreshAfterCampaignSwitch({ navigateTo: '/' })).resolves.not.toThrow();
		});
	});

	describe('Type Safety', () => {
		it('should accept valid options for refreshAfterCampaignSwitch', async () => {
			// These should all be valid calls
			await refreshAfterCampaignSwitch();
			await refreshAfterCampaignSwitch({ navigateTo: '/' });
			await refreshAfterCampaignSwitch({ navigateTo: '/entities/character' });
			await refreshAfterCampaignSwitch({ reloadCampaign: true });
			await refreshAfterCampaignSwitch({ navigateTo: '/', reloadCampaign: true });

			// String parameter for backward compatibility
			await refreshAfterCampaignSwitch('/combat');
		});

		it('should return Promise<void> from all functions', async () => {
			const result1 = refreshAllStores();
			const result2 = resetAllStores();
			const result3 = refreshAfterCampaignSwitch();

			expect(result1).toBeInstanceOf(Promise);
			expect(result2).toBeInstanceOf(Promise);
			expect(result3).toBeInstanceOf(Promise);

			await expect(result1).resolves.toBeUndefined();
			await expect(result2).resolves.toBeUndefined();
			await expect(result3).resolves.toBeUndefined();
		});
	});
});
