/**
 * Tests for SceneContextPanel Component
 *
 * TDD RED PHASE - Tests for Issue #292: Scene Runner Mode
 *
 * SceneContextPanel displays context information for the scene:
 * - Location reference (if set)
 * - NPC references (if set)
 * - Click to view entity details
 *
 * These tests will FAIL until the component is implemented in the GREEN phase.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import SceneContextPanel from './SceneContextPanel.svelte';
import type { BaseEntity } from '$lib/types';

// Mock entity repository
const { mockGetById } = vi.hoisted(() => ({
	mockGetById: vi.fn()
}));

vi.mock('$lib/db/entityRepository', () => ({
	entityRepository: {
		getById: mockGetById
	}
}));

describe('SceneContextPanel Component - Basic Rendering', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should render without crashing with no context', () => {
		const { container } = render(SceneContextPanel, {
			props: {
				locationRef: undefined,
				npcRefs: []
			}
		});

		expect(container).toBeInTheDocument();
	});

	it('should display "Scene Context" heading', () => {
		render(SceneContextPanel, {
			props: {
				locationRef: undefined,
				npcRefs: []
			}
		});

		expect(screen.getByText(/scene context/i)).toBeInTheDocument();
	});

	it('should show empty state when no location or NPCs', () => {
		render(SceneContextPanel, {
			props: {
				locationRef: undefined,
				npcRefs: []
			}
		});

		expect(screen.getByText(/no context.*defined|no location.*npcs/i)).toBeInTheDocument();
	});
});

describe('SceneContextPanel Component - Location Display', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should display location name when locationRef is set', async () => {
		const mockLocation: BaseEntity = {
			id: 'location-1',
			type: 'location',
			name: 'The Dragon\'s Lair',
			description: 'A dangerous cave',
			tags: [],
			fields: {},
			links: [],
			notes: '',
			createdAt: new Date(),
			updatedAt: new Date(),
			metadata: {}
		};

		mockGetById.mockResolvedValue(mockLocation);

		render(SceneContextPanel, {
			props: {
				locationRef: 'location-1',
				npcRefs: []
			}
		});

		await screen.findByText('The Dragon\'s Lair');
		expect(screen.getByText('The Dragon\'s Lair')).toBeInTheDocument();
	});

	it('should display "Location:" label before location name', async () => {
		const mockLocation: BaseEntity = {
			id: 'location-2',
			type: 'location',
			name: 'Tavern',
			description: '',
			tags: [],
			fields: {},
			links: [],
			notes: '',
			createdAt: new Date(),
			updatedAt: new Date(),
			metadata: {}
		};

		mockGetById.mockResolvedValue(mockLocation);

		render(SceneContextPanel, {
			props: {
				locationRef: 'location-2',
				npcRefs: []
			}
		});

		await screen.findByText(/location:/i);
		expect(screen.getByText(/location:/i)).toBeInTheDocument();
	});

	it('should handle missing location gracefully', async () => {
		mockGetById.mockResolvedValue(null);

		render(SceneContextPanel, {
			props: {
				locationRef: 'missing-location',
				npcRefs: []
			}
		});

		// Should not crash, may show "Location not found" or hide location section
		expect(screen.queryByText(/location.*not.*found|unknown.*location/i)).toBeInTheDocument();
	});

	it('should make location name clickable', async () => {
		const mockLocation: BaseEntity = {
			id: 'location-3',
			type: 'location',
			name: 'Castle Gate',
			description: '',
			tags: [],
			fields: {},
			links: [],
			notes: '',
			createdAt: new Date(),
			updatedAt: new Date(),
			metadata: {}
		};

		mockGetById.mockResolvedValue(mockLocation);

		render(SceneContextPanel, {
			props: {
				locationRef: 'location-3',
				npcRefs: []
			}
		});

		const locationLink = await screen.findByRole('button', { name: /castle gate/i });
		expect(locationLink).toBeInTheDocument();
	});

	it('should emit event when location is clicked', async () => {
		const mockLocation: BaseEntity = {
			id: 'location-4',
			type: 'location',
			name: 'Forest',
			description: '',
			tags: [],
			fields: {},
			links: [],
			notes: '',
			createdAt: new Date(),
			updatedAt: new Date(),
			metadata: {}
		};

		mockGetById.mockResolvedValue(mockLocation);

		const onEntityClick = vi.fn();
		render(SceneContextPanel, {
			props: {
				locationRef: 'location-4',
				npcRefs: [],
				onEntityClick
			}
		});

		const locationLink = await screen.findByRole('button', { name: /forest/i });
		await fireEvent.click(locationLink);

		expect(onEntityClick).toHaveBeenCalledWith('location-4', 'location');
	});
});

describe('SceneContextPanel Component - NPCs Display', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should display NPC names when npcRefs are set', async () => {
		const mockNpc1: BaseEntity = {
			id: 'npc-1',
			type: 'npc',
			name: 'Gandalf',
			description: '',
			tags: [],
			fields: {},
			links: [],
			notes: '',
			createdAt: new Date(),
			updatedAt: new Date(),
			metadata: {}
		};

		const mockNpc2: BaseEntity = {
			id: 'npc-2',
			type: 'npc',
			name: 'Aragorn',
			description: '',
			tags: [],
			fields: {},
			links: [],
			notes: '',
			createdAt: new Date(),
			updatedAt: new Date(),
			metadata: {}
		};

		mockGetById.mockImplementation((id: string) => {
			if (id === 'npc-1') return Promise.resolve(mockNpc1);
			if (id === 'npc-2') return Promise.resolve(mockNpc2);
			return Promise.resolve(null);
		});

		render(SceneContextPanel, {
			props: {
				locationRef: undefined,
				npcRefs: ['npc-1', 'npc-2']
			}
		});

		await screen.findByText('Gandalf');
		expect(screen.getByText('Gandalf')).toBeInTheDocument();
		expect(screen.getByText('Aragorn')).toBeInTheDocument();
	});

	it('should display "NPCs:" label before NPC list', async () => {
		const mockNpc: BaseEntity = {
			id: 'npc-3',
			type: 'npc',
			name: 'Shopkeeper',
			description: '',
			tags: [],
			fields: {},
			links: [],
			notes: '',
			createdAt: new Date(),
			updatedAt: new Date(),
			metadata: {}
		};

		mockGetById.mockResolvedValue(mockNpc);

		render(SceneContextPanel, {
			props: {
				locationRef: undefined,
				npcRefs: ['npc-3']
			}
		});

		await screen.findByText(/npcs:/i);
		expect(screen.getByText(/npcs:/i)).toBeInTheDocument();
	});

	it('should handle empty NPC array', () => {
		render(SceneContextPanel, {
			props: {
				locationRef: undefined,
				npcRefs: []
			}
		});

		expect(screen.queryByText(/npcs:/i)).not.toBeInTheDocument();
	});

	it('should make each NPC name clickable', async () => {
		const mockNpc: BaseEntity = {
			id: 'npc-4',
			type: 'npc',
			name: 'Mysterious Stranger',
			description: '',
			tags: [],
			fields: {},
			links: [],
			notes: '',
			createdAt: new Date(),
			updatedAt: new Date(),
			metadata: {}
		};

		mockGetById.mockResolvedValue(mockNpc);

		render(SceneContextPanel, {
			props: {
				locationRef: undefined,
				npcRefs: ['npc-4']
			}
		});

		const npcButton = await screen.findByRole('button', { name: /mysterious stranger/i });
		expect(npcButton).toBeInTheDocument();
	});

	it('should call onEntityClick when NPC is clicked', async () => {
		const mockNpc: BaseEntity = {
			id: 'npc-5',
			type: 'npc',
			name: 'Guard Captain',
			description: '',
			tags: [],
			fields: {},
			links: [],
			notes: '',
			createdAt: new Date(),
			updatedAt: new Date(),
			metadata: {}
		};

		mockGetById.mockResolvedValue(mockNpc);

		const onEntityClick = vi.fn();
		render(SceneContextPanel, {
			props: {
				locationRef: undefined,
				npcRefs: ['npc-5'],
				onEntityClick
			}
		});

		const npcButton = await screen.findByRole('button', { name: /guard captain/i });
		await fireEvent.click(npcButton);

		expect(onEntityClick).toHaveBeenCalledWith('npc-5', 'npc');
	});

	it('should filter out missing NPCs gracefully', async () => {
		const mockNpc: BaseEntity = {
			id: 'npc-6',
			type: 'npc',
			name: 'Valid NPC',
			description: '',
			tags: [],
			fields: {},
			links: [],
			notes: '',
			createdAt: new Date(),
			updatedAt: new Date(),
			metadata: {}
		};

		mockGetById.mockImplementation((id: string) => {
			if (id === 'npc-6') return Promise.resolve(mockNpc);
			return Promise.resolve(null);
		});

		render(SceneContextPanel, {
			props: {
				locationRef: undefined,
				npcRefs: ['npc-6', 'missing-npc', 'another-missing']
			}
		});

		await screen.findByText('Valid NPC');
		expect(screen.getByText('Valid NPC')).toBeInTheDocument();
		// Missing NPCs should not appear or cause errors
	});
});

describe('SceneContextPanel Component - Combined Display', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should display both location and NPCs together', async () => {
		const mockLocation: BaseEntity = {
			id: 'location-5',
			type: 'location',
			name: 'Throne Room',
			description: '',
			tags: [],
			fields: {},
			links: [],
			notes: '',
			createdAt: new Date(),
			updatedAt: new Date(),
			metadata: {}
		};

		const mockNpc: BaseEntity = {
			id: 'npc-7',
			type: 'npc',
			name: 'King',
			description: '',
			tags: [],
			fields: {},
			links: [],
			notes: '',
			createdAt: new Date(),
			updatedAt: new Date(),
			metadata: {}
		};

		mockGetById.mockImplementation((id: string) => {
			if (id === 'location-5') return Promise.resolve(mockLocation);
			if (id === 'npc-7') return Promise.resolve(mockNpc);
			return Promise.resolve(null);
		});

		render(SceneContextPanel, {
			props: {
				locationRef: 'location-5',
				npcRefs: ['npc-7']
			}
		});

		await screen.findByText('Throne Room');
		expect(screen.getByText('Throne Room')).toBeInTheDocument();
		expect(screen.getByText('King')).toBeInTheDocument();
	});

	it('should layout location above NPCs', async () => {
		const mockLocation: BaseEntity = {
			id: 'location-6',
			type: 'location',
			name: 'Market',
			description: '',
			tags: [],
			fields: {},
			links: [],
			notes: '',
			createdAt: new Date(),
			updatedAt: new Date(),
			metadata: {}
		};

		const mockNpc: BaseEntity = {
			id: 'npc-8',
			type: 'npc',
			name: 'Merchant',
			description: '',
			tags: [],
			fields: {},
			links: [],
			notes: '',
			createdAt: new Date(),
			updatedAt: new Date(),
			metadata: {}
		};

		mockGetById.mockImplementation((id: string) => {
			if (id === 'location-6') return Promise.resolve(mockLocation);
			if (id === 'npc-8') return Promise.resolve(mockNpc);
			return Promise.resolve(null);
		});

		const { container } = render(SceneContextPanel, {
			props: {
				locationRef: 'location-6',
				npcRefs: ['npc-8']
			}
		});

		await screen.findByText('Market');

		// Check that location appears before NPCs in DOM order
		const locationElement = screen.getByText(/location:/i);
		const npcElement = screen.getByText(/npcs:/i);

		expect(locationElement.compareDocumentPosition(npcElement)).toBe(
			Node.DOCUMENT_POSITION_FOLLOWING
		);
	});
});

describe('SceneContextPanel Component - Loading States', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should show loading indicator while fetching entities', () => {
		mockGetById.mockImplementation(() => new Promise(() => {})); // Never resolves

		render(SceneContextPanel, {
			props: {
				locationRef: 'location-7',
				npcRefs: ['npc-9']
			}
		});

		expect(screen.getByText(/loading|fetching/i)).toBeInTheDocument();
	});

	it('should replace loading indicator with content when loaded', async () => {
		const mockLocation: BaseEntity = {
			id: 'location-8',
			type: 'location',
			name: 'Loaded Location',
			description: '',
			tags: [],
			fields: {},
			links: [],
			notes: '',
			createdAt: new Date(),
			updatedAt: new Date(),
			metadata: {}
		};

		mockGetById.mockResolvedValue(mockLocation);

		render(SceneContextPanel, {
			props: {
				locationRef: 'location-8',
				npcRefs: []
			}
		});

		await screen.findByText('Loaded Location');

		expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
	});
});
