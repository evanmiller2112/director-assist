import { vi } from 'vitest';
import type { BaseEntity } from '$lib/types';

/**
 * Creates a mock entities store for testing
 */
export function createMockEntitiesStore(entities: BaseEntity[] = []) {
	let searchQuery = '';
	let _entities = entities;
	let _availableRelationshipTypes: string[] = [];

	const filteredEntities = () => {
		if (!searchQuery) return _entities;
		const query = searchQuery.toLowerCase();
		return _entities.filter(
			(e) =>
				e.name.toLowerCase().includes(query) ||
				e.description.toLowerCase().includes(query) ||
				e.tags.some((t) => t.toLowerCase().includes(query))
		);
	};

	let _relationshipFilter: {
		relatedToEntityId?: string;
		relationshipType?: string;
		hasRelationships?: boolean;
	} = {};

	return {
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
		getById: vi.fn(),
		getByType: vi.fn(),
		addLink: vi.fn(),
		removeLink: vi.fn(),
		getLinkedWithRelationships: vi.fn(() => []),
		// Relationship filter methods (Issue #78)
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
		// Update method for tests
		_setEntities: (newEntities: BaseEntity[]) => {
			_entities = newEntities;
		}
	};
}

/**
 * Creates a mock campaign store for testing
 */
export function createMockCampaignStore() {
	const campaign = {
		id: 'test-campaign',
		type: 'campaign',
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
	};

	const store = {
		campaign,
		customEntityTypes: [] as Array<unknown>,
		entityTypeOverrides: [] as Array<unknown>,
		allCampaigns: [campaign] as typeof campaign[],
		activeCampaignId: 'test-campaign',
		load: vi.fn(),
		setActiveCampaign: vi.fn(),
		// Campaign linking getters (Issue #48)
		get enforceCampaignLinking(): boolean {
			const settings = (store.campaign?.metadata as any)?.settings;
			return settings?.enforceCampaignLinking ?? false;
		},
		get defaultCampaignId(): string | undefined {
			const settings = (store.campaign?.metadata as any)?.settings;
			return settings?.defaultCampaignId;
		},
		// Campaign linking methods (Issue #48)
		setEnforceCampaignLinking: vi.fn(),
		setDefaultCampaignId: vi.fn()
	};

	return store;
}

/**
 * Creates a mock UI store for testing
 */
export function createMockUiStore() {
	return {
		sidebarOpen: true,
		chatPanelOpen: false,
		theme: 'light',
		toggleSidebar: vi.fn(),
		toggleChatPanel: vi.fn(),
		loadTheme: vi.fn()
	};
}

/**
 * Creates a mock notification store for testing
 */
export function createMockNotificationStore() {
	return {
		notifications: [],
		success: vi.fn(),
		error: vi.fn(),
		info: vi.fn(),
		warning: vi.fn(),
		dismiss: vi.fn()
	};
}

/**
 * Creates a mock AI settings store for testing
 */
export function createMockAiSettings(enabled = false) {
	let aiEnabled = enabled;
	return {
		get aiEnabled() {
			return aiEnabled;
		},
		get isEnabled() {
			return aiEnabled;
		},
		load: vi.fn(async () => {
			// Check for API keys and stored preference
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
