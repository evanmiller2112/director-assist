/**
 * Reactive Mock Stores for Svelte 5 Testing
 *
 * These stores use Svelte 5 $state() runes to enable proper reactivity
 * in component tests. Unlike the plain JavaScript mock stores, these
 * will trigger Svelte's reactivity system when values change.
 */

import { vi } from 'vitest';
import type { BaseEntity } from '$lib/types';

/**
 * Creates a reactive mock entities store using Svelte 5 $state
 */
export function createReactiveMockEntitiesStore(initialEntities: BaseEntity[] = []) {
	// Use $state to make these values reactive
	let searchQuery = $state('');
	let _entities = $state<BaseEntity[]>(initialEntities);
	let _availableRelationshipTypes = $state<string[]>([]);
	let _relationshipFilter = $state<{
		relatedToEntityId?: string;
		relationshipType?: string;
		hasRelationships?: boolean;
	}>({});

	// Derived computed value for filtered entities
	const filteredEntities = $derived(() => {
		if (!searchQuery) return _entities;
		const query = searchQuery.toLowerCase();
		return _entities.filter(
			(e) =>
				e.name.toLowerCase().includes(query) ||
				e.description.toLowerCase().includes(query) ||
				e.tags.some((t) => t.toLowerCase().includes(query))
		);
	});

	const store = {
		get entities() {
			return _entities;
		},
		get filteredEntities() {
			return filteredEntities();
		},
		get searchQuery() {
			return searchQuery;
		},
		get availableRelationshipTypes() {
			return _availableRelationshipTypes;
		},
		get relationshipFilter() {
			return _relationshipFilter;
		},
		set availableRelationshipTypes(types: string[]) {
			_availableRelationshipTypes = types;
		},
		setSearchQuery: vi.fn((query: string) => {
			searchQuery = query;
		}),
		load: vi.fn(),
		create: vi.fn(),
		update: vi.fn(),
		delete: vi.fn(),
		getById: vi.fn((id: string) => _entities.find(e => e.id === id)),
		getByType: vi.fn((type: string) => _entities.filter(e => e.type === type)),
		addLink: vi.fn(),
		removeLink: vi.fn(),
		getLinkedWithRelationships: vi.fn(() => []),
		filterByRelatedTo: vi.fn((entityId: string) => {
			_relationshipFilter = { ..._relationshipFilter, relatedToEntityId: entityId };
		}),
		filterByRelationshipType: vi.fn((type: string) => {
			_relationshipFilter = { ..._relationshipFilter, relationshipType: type };
		}),
		filterByHasRelationships: vi.fn((has: boolean) => {
			_relationshipFilter = { ..._relationshipFilter, hasRelationships: has };
		}),
		setRelationshipFilter: vi.fn((filter: typeof _relationshipFilter) => {
			_relationshipFilter = filter;
		}),
		clearRelationshipFilter: vi.fn(() => {
			_relationshipFilter = {};
		}),
		// Test helper to update entities reactively
		_setEntities: (newEntities: BaseEntity[]) => {
			_entities = newEntities;
			// Also update the getById mock to use the new entities
			store.getById = vi.fn((id: string) => _entities.find(e => e.id === id));
		}
	};

	return store;
}

/**
 * Creates a reactive mock campaign store using Svelte 5 $state
 */
export function createReactiveMockCampaignStore() {
	const campaign = $state({
		id: 'test-campaign',
		type: 'campaign' as const,
		name: 'Test Campaign',
		description: 'Test campaign description',
		tags: [] as string[],
		fields: { system: 'Test System' } as Record<string, unknown>,
		links: [] as Array<{ id: string; targetId: string; targetType: string; relationship: string; bidirectional: boolean }>,
		notes: '',
		createdAt: new Date(),
		updatedAt: new Date(),
		metadata: {
			customEntityTypes: [],
			entityTypeOverrides: [],
			settings: {
				customRelationships: [],
				enabledEntityTypes: [],
				enforceCampaignLinking: false,
				defaultCampaignId: undefined
			}
		} as Record<string, unknown>
	});

	let customEntityTypes = $state<Array<unknown>>([]);
	let entityTypeOverrides = $state<Array<unknown>>([]);
	let allCampaigns = $state([campaign]);
	let activeCampaignId = $state('test-campaign');

	const store = {
		get campaign() {
			return campaign;
		},
		get customEntityTypes() {
			return customEntityTypes;
		},
		get entityTypeOverrides() {
			return entityTypeOverrides;
		},
		get allCampaigns() {
			return allCampaigns;
		},
		get activeCampaignId() {
			return activeCampaignId;
		},
		load: vi.fn(),
		setActiveCampaign: vi.fn(),
		getCurrentSystemProfile: vi.fn(() => 'Test System'),
		get enforceCampaignLinking(): boolean {
			const settings = (campaign?.metadata as any)?.settings;
			return settings?.enforceCampaignLinking ?? false;
		},
		get defaultCampaignId(): string | undefined {
			const settings = (campaign?.metadata as any)?.settings;
			return settings?.defaultCampaignId;
		},
		setEnforceCampaignLinking: vi.fn(),
		setDefaultCampaignId: vi.fn()
	};

	return store;
}

/**
 * Creates a reactive mock AI settings store using Svelte 5 $state
 */
export function createReactiveMockAiSettings(enabled = false) {
	let aiEnabled = $state(enabled);

	return {
		get aiEnabled() {
			return aiEnabled;
		},
		get isEnabled() {
			return aiEnabled;
		},
		load: vi.fn(async () => {
			const hasApiKey =
				!!localStorage.getItem('dm-assist-api-key') ||
				!!localStorage.getItem('ai-provider-anthropic-apikey') ||
				!!localStorage.getItem('ai-provider-openai-apikey');
			const stored = localStorage.getItem('dm-assist-ai-enabled');
			if (stored !== null) {
				aiEnabled = stored === 'true';
			} else {
				aiEnabled = hasApiKey;
			}
		}),
		setEnabled: vi.fn(async (value: boolean) => {
			aiEnabled = value;
			localStorage.setItem('dm-assist-ai-enabled', String(value));
		}),
		toggle: vi.fn(async () => {
			aiEnabled = !aiEnabled;
			localStorage.setItem('dm-assist-ai-enabled', String(aiEnabled));
		})
	};
}
