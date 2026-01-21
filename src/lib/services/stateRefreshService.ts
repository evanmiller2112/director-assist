/**
 * State Refresh Service
 *
 * Issue #252: Replace window.location.reload() with in-memory state refresh
 *
 * This service provides centralized functions to refresh application state
 * from the database without requiring full page reloads.
 */

import {
	campaignStore,
	entitiesStore,
	conversationStore,
	chatStore,
	combatStore
} from '$lib/stores';
import { goto } from '$app/navigation';

/**
 * Refresh all stores from the database
 * Use this after major data changes (imports, migrations, etc.)
 */
export async function refreshAllStores(): Promise<void> {
	// Load all stores in parallel for performance
	const results = await Promise.allSettled([
		campaignStore.load(),
		entitiesStore.load(),
		conversationStore.load(),
		chatStore.load(),
		combatStore.load ? combatStore.load() : Promise.resolve()
	]);

	// Log any errors but don't throw
	results.forEach((result, index) => {
		if (result.status === 'rejected') {
			const storeNames = ['campaignStore', 'entitiesStore', 'conversationStore', 'chatStore', 'combatStore'];
			console.error(`Error refreshing ${storeNames[index]}:`, result.reason);
		}
	});
}

/**
 * Reset all stores to clean state
 * Use this after clearing all data
 */
export async function resetAllStores(): Promise<void> {
	try {
		// Reset stores in order: campaign first (entities depend on campaign)
		// Using synchronous resets but wrapping in try-catch for safety
		if (campaignStore.reset) {
			try {
				campaignStore.reset();
			} catch (error) {
				console.error('Error resetting campaign store:', error);
			}
		}

		if (entitiesStore.reset) {
			try {
				entitiesStore.reset();
			} catch (error) {
				console.error('Error resetting entities store:', error);
			}
		}

		if (conversationStore.reset) {
			try {
				conversationStore.reset();
			} catch (error) {
				console.error('Error resetting conversation store:', error);
			}
		}

		if (chatStore.reset) {
			try {
				chatStore.reset();
			} catch (error) {
				console.error('Error resetting chat store:', error);
			}
		}

		if (combatStore.reset) {
			try {
				combatStore.reset();
			} catch (error) {
				console.error('Error resetting combat store:', error);
			}
		}
	} catch (error) {
		console.error('Error resetting stores:', error);
	}
}

/**
 * Refresh state after switching campaigns
 * Optionally navigate to a new path after refresh
 *
 * @param options - Options for refresh behavior
 * @param options.navigateTo - Path to navigate to after refresh (optional)
 * @param options.reloadCampaign - Whether to reload campaign store (default: false)
 */
export async function refreshAfterCampaignSwitch(
	options?: string | { navigateTo?: string; reloadCampaign?: boolean }
): Promise<void> {
	// Parse options (support both string and object for backward compatibility)
	const navigateTo = typeof options === 'string' ? options : options?.navigateTo;
	const reloadCampaign = typeof options === 'object' ? options?.reloadCampaign : false;

	// Refresh campaign-dependent stores in parallel
	const refreshPromises = [
		entitiesStore.load(),
		conversationStore.load(),
		chatStore.load(),
		combatStore.load ? combatStore.load() : Promise.resolve()
	];

	// Optionally reload campaign store
	if (reloadCampaign) {
		refreshPromises.push(campaignStore.load());
	}

	await Promise.allSettled(refreshPromises);

	// Navigate if path provided
	if (navigateTo) {
		try {
			await goto(navigateTo);
		} catch (error) {
			console.error('Error navigating after campaign switch:', error);
			// Swallow navigation errors - they're not critical
		}
	}
}
