import { vi } from 'vitest';
import type { BaseEntity } from '$lib/types';

/**
 * Creates a mock entities store for testing
 */
export function createMockEntitiesStore(entities: BaseEntity[] = []) {
	let searchQuery = '';
	let _entities = entities;

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
		metadata: {} as Record<string, unknown>
	};

	return {
		campaign,
		customEntityTypes: [] as Array<unknown>,
		entityTypeOverrides: [] as Array<unknown>,
		allCampaigns: [campaign] as typeof campaign[],
		activeCampaignId: 'test-campaign',
		load: vi.fn(),
		setActiveCampaign: vi.fn()
	};
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
