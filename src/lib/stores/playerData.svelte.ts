/**
 * Player Data Store (Svelte 5 Runes)
 *
 * Issue #441: Player route layout and navigation
 *
 * This store manages player export data state for the player view.
 * It provides reactive state, derived values, and helper methods for accessing and searching entities.
 */

import type { PlayerExport, PlayerEntity } from '$lib/types/playerExport';

// Core state using $state runes (module-level for singleton pattern)
let data = $state<PlayerExport | null>(null);
let isLoading = $state(false);
let error = $state<string | null>(null);

// Derived state: isLoaded
const isLoaded = $derived(data !== null);

// Derived state: campaignName
const campaignName = $derived(data?.campaignName ?? '');

// Derived state: campaignDescription
const campaignDescription = $derived(data?.campaignDescription ?? '');

// Derived state: entities
const entities = $derived(data?.entities ?? []);

// Derived state: entityTypes (unique types from entities)
const entityTypes = $derived.by(() => {
	if (!data?.entities) return [];
	const types = new Set(data.entities.map((e) => e.type));
	return Array.from(types);
});

// Derived state: entitiesByType (group entities by type)
const entitiesByType = $derived.by(() => {
	if (!data?.entities) return {};

	const grouped: Record<string, PlayerEntity[]> = {};
	for (const entity of data.entities) {
		if (!grouped[entity.type]) {
			grouped[entity.type] = [];
		}
		grouped[entity.type].push(entity);
	}
	return grouped;
});

// Export the store object with getters and methods
export const playerDataStore = {
	// Getters for state
	get data() {
		return data;
	},
	get isLoaded() {
		return isLoaded;
	},
	get isLoading() {
		return isLoading;
	},
	get error() {
		return error;
	},

	// Getters for derived state
	get campaignName() {
		return campaignName;
	},
	get campaignDescription() {
		return campaignDescription;
	},
	get entities() {
		return entities;
	},
	get entityTypes() {
		return entityTypes;
	},
	get entitiesByType() {
		return entitiesByType;
	},

	// Methods
	load(exportData: PlayerExport) {
		data = exportData;
		isLoading = false;
		error = null;
	},

	setLoading(loading: boolean) {
		isLoading = loading;
	},

	setError(err: string | null) {
		error = err;
		isLoading = false;
	},

	clear() {
		data = null;
		isLoading = false;
		error = null;
	},

	getEntityById(id: string): PlayerEntity | undefined {
		if (!data?.entities) return undefined;
		return data.entities.find((e) => e.id === id);
	},

	getByType(type: string): PlayerEntity[] {
		if (!data?.entities) return [];
		return data.entities.filter((e) => e.type === type);
	},

	searchEntities(query: string): PlayerEntity[] {
		if (!data?.entities) return [];

		// Trim the query
		const trimmedQuery = query.trim();

		// Return all entities for empty/whitespace-only queries
		if (trimmedQuery === '') return data.entities;

		// Convert query to lowercase for case-insensitive search
		const lowerQuery = trimmedQuery.toLowerCase();

		// Search across name, description, summary, and tags
		return data.entities.filter((entity) => {
			// Search in name
			if (entity.name.toLowerCase().includes(lowerQuery)) {
				return true;
			}

			// Search in description
			if (entity.description.toLowerCase().includes(lowerQuery)) {
				return true;
			}

			// Search in summary (if it exists)
			if (entity.summary?.toLowerCase().includes(lowerQuery)) {
				return true;
			}

			// Search in tags
			if (entity.tags.some((tag) => tag.toLowerCase().includes(lowerQuery))) {
				return true;
			}

			return false;
		});
	}
};
