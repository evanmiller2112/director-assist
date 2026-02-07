/**
 * Tests for Scene List Page (/scene)
 *
 * TDD RED PHASE - Tests for Issue #292: Scene Runner Mode
 *
 * This page displays all scenes and allows the user to:
 * - View all scenes from current campaign
 * - See scene status (planned, active, completed)
 * - Filter scenes by status
 * - Navigate to scene runner
 * - Create new scenes
 *
 * These tests will FAIL until the page is implemented in the GREEN phase.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/svelte';
import SceneListPage from '../../../routes/scene/+page.svelte';
import { goto } from '$app/navigation';
import type { BaseEntity } from '$lib/types';

// Mock navigation
vi.mock('$app/navigation', () => ({
	goto: vi.fn()
}));

// Mock entity repository
const mockGetAll = vi.fn();
vi.mock('$lib/db/entityRepository', () => ({
	entityRepository: {
		getAll: mockGetAll
	}
}));

// Mock campaign store
const mockCampaignId = 'test-campaign-123';
vi.mock('$lib/stores', () => ({
	campaignStore: {
		campaign: { id: mockCampaignId, name: 'Test Campaign' }
	}
}));

// Helper to create mock scenes
function createMockScene(overrides: Partial<BaseEntity> = {}): BaseEntity {
	return {
		id: 'scene-1',
		type: 'scene',
		name: 'Test Scene',
		description: 'A test scene',
		tags: [],
		fields: { status: 'planned' },
		links: [],
		notes: '',
		createdAt: new Date(),
		updatedAt: new Date(),
		metadata: { campaignId: mockCampaignId },
		...overrides
	};
}

describe('Scene List Page - Basic Rendering', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockGetAll.mockResolvedValue([]);
	});

	it('should render without crashing', async () => {
		const { container } = render(SceneListPage);
		expect(container).toBeInTheDocument();
	});

	it('should display "Scenes" heading', async () => {
		render(SceneListPage);
		expect(screen.getByRole('heading', { name: /scenes/i })).toBeInTheDocument();
	});

	it('should display "New Scene" button', async () => {
		render(SceneListPage);
		expect(screen.getByRole('button', { name: /new scene/i })).toBeInTheDocument();
	});

	it('should show empty state when no scenes exist', async () => {
		mockGetAll.mockResolvedValue([]);
		render(SceneListPage);

		await screen.findByText(/no scenes/i);
		expect(screen.getByText(/no scenes/i)).toBeInTheDocument();
	});

	it('should load and display scenes on mount', async () => {
		const mockScenes: BaseEntity[] = [
			createMockScene({ id: 'scene-1', name: 'Opening Scene' }),
			createMockScene({ id: 'scene-2', name: 'Finale Scene' })
		];

		mockGetAll.mockResolvedValue(mockScenes);
		render(SceneListPage);

		await screen.findByText('Opening Scene');
		expect(screen.getByText('Opening Scene')).toBeInTheDocument();
		expect(screen.getByText('Finale Scene')).toBeInTheDocument();
	});
});

describe('Scene List Page - Scene Cards', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should display scene name on each card', async () => {
		const mockScenes: BaseEntity[] = [
			createMockScene({ id: 'scene-1', name: 'The Dragon Attack' })
		];

		mockGetAll.mockResolvedValue(mockScenes);
		render(SceneListPage);

		await screen.findByText('The Dragon Attack');
		expect(screen.getByText('The Dragon Attack')).toBeInTheDocument();
	});

	it('should display scene status badge on each card', async () => {
		const mockScenes: BaseEntity[] = [
			createMockScene({
				id: 'scene-1',
				name: 'Test',
				fields: { status: 'active' }
			})
		];

		mockGetAll.mockResolvedValue(mockScenes);
		render(SceneListPage);

		await screen.findByText(/active/i);
		expect(screen.getByText(/active/i)).toBeInTheDocument();
	});

	it('should display scene description if available', async () => {
		const mockScenes: BaseEntity[] = [
			createMockScene({
				id: 'scene-1',
				name: 'Test',
				description: 'The heroes face their greatest challenge'
			})
		];

		mockGetAll.mockResolvedValue(mockScenes);
		render(SceneListPage);

		await screen.findByText(/greatest challenge/i);
		expect(screen.getByText(/greatest challenge/i)).toBeInTheDocument();
	});

	it('should show truncated description for long text', async () => {
		const longDescription = 'Lorem ipsum dolor sit amet, '.repeat(20);

		const mockScenes: BaseEntity[] = [
			createMockScene({
				id: 'scene-1',
				name: 'Test',
				description: longDescription
			})
		];

		mockGetAll.mockResolvedValue(mockScenes);
		const { container } = render(SceneListPage);

		await screen.findByText(/Lorem ipsum/i);

		// Description should be truncated (line-clamp or similar)
		const descElement = container.querySelector('[data-testid="scene-description"]');
		expect(descElement).toHaveClass(/line-clamp|truncate/);
	});

	it('should display "Run Scene" button on each card', async () => {
		const mockScenes: BaseEntity[] = [
			createMockScene({ id: 'scene-1', name: 'Test' })
		];

		mockGetAll.mockResolvedValue(mockScenes);
		render(SceneListPage);

		await screen.findByText('Test');
		expect(screen.getByRole('button', { name: /run.*scene/i })).toBeInTheDocument();
	});

	it('should navigate to scene runner when "Run Scene" clicked', async () => {
		const mockScenes: BaseEntity[] = [
			createMockScene({ id: 'scene-123', name: 'Test' })
		];

		mockGetAll.mockResolvedValue(mockScenes);
		render(SceneListPage);

		const runButton = await screen.findByRole('button', { name: /run.*scene/i });
		await fireEvent.click(runButton);

		expect(goto).toHaveBeenCalledWith('/scene/scene-123');
	});

	it('should display multiple scene cards', async () => {
		const mockScenes: BaseEntity[] = [
			createMockScene({ id: 'scene-1', name: 'Scene 1' }),
			createMockScene({ id: 'scene-2', name: 'Scene 2' }),
			createMockScene({ id: 'scene-3', name: 'Scene 3' })
		];

		mockGetAll.mockResolvedValue(mockScenes);
		render(SceneListPage);

		await screen.findByText('Scene 1');
		expect(screen.getByText('Scene 1')).toBeInTheDocument();
		expect(screen.getByText('Scene 2')).toBeInTheDocument();
		expect(screen.getByText('Scene 3')).toBeInTheDocument();
	});
});

describe('Scene List Page - Status Filtering', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should display status filter tabs', async () => {
		mockGetAll.mockResolvedValue([]);
		render(SceneListPage);

		expect(screen.getByRole('tab', { name: /all/i })).toBeInTheDocument();
		expect(screen.getByRole('tab', { name: /planned/i })).toBeInTheDocument();
		expect(screen.getByRole('tab', { name: /active/i })).toBeInTheDocument();
		expect(screen.getByRole('tab', { name: /completed/i })).toBeInTheDocument();
	});

	it('should show all scenes by default', async () => {
		const mockScenes: BaseEntity[] = [
			createMockScene({ id: 'scene-1', fields: { status: 'planned' } }),
			createMockScene({ id: 'scene-2', fields: { status: 'active' } }),
			createMockScene({ id: 'scene-3', fields: { status: 'completed' } })
		];

		mockGetAll.mockResolvedValue(mockScenes);
		render(SceneListPage);

		await screen.findAllByTestId('scene-card');
		const cards = screen.getAllByTestId('scene-card');
		expect(cards).toHaveLength(3);
	});

	it('should filter to show only planned scenes', async () => {
		const mockScenes: BaseEntity[] = [
			createMockScene({ id: 'scene-1', name: 'Planned 1', fields: { status: 'planned' } }),
			createMockScene({ id: 'scene-2', name: 'Active 1', fields: { status: 'active' } }),
			createMockScene({ id: 'scene-3', name: 'Planned 2', fields: { status: 'planned' } })
		];

		mockGetAll.mockResolvedValue(mockScenes);
		render(SceneListPage);

		const plannedTab = await screen.findByRole('tab', { name: /planned/i });
		await fireEvent.click(plannedTab);

		expect(screen.getByText('Planned 1')).toBeInTheDocument();
		expect(screen.getByText('Planned 2')).toBeInTheDocument();
		expect(screen.queryByText('Active 1')).not.toBeInTheDocument();
	});

	it('should filter to show only active scenes', async () => {
		const mockScenes: BaseEntity[] = [
			createMockScene({ id: 'scene-1', name: 'Planned 1', fields: { status: 'planned' } }),
			createMockScene({ id: 'scene-2', name: 'Active 1', fields: { status: 'active' } }),
			createMockScene({ id: 'scene-3', name: 'Active 2', fields: { status: 'active' } })
		];

		mockGetAll.mockResolvedValue(mockScenes);
		render(SceneListPage);

		const activeTab = await screen.findByRole('tab', { name: /active/i });
		await fireEvent.click(activeTab);

		expect(screen.getByText('Active 1')).toBeInTheDocument();
		expect(screen.getByText('Active 2')).toBeInTheDocument();
		expect(screen.queryByText('Planned 1')).not.toBeInTheDocument();
	});

	it('should filter to show only completed scenes', async () => {
		const mockScenes: BaseEntity[] = [
			createMockScene({ id: 'scene-1', name: 'Active 1', fields: { status: 'active' } }),
			createMockScene({ id: 'scene-2', name: 'Completed 1', fields: { status: 'completed' } })
		];

		mockGetAll.mockResolvedValue(mockScenes);
		render(SceneListPage);

		const completedTab = await screen.findByRole('tab', { name: /completed/i });
		await fireEvent.click(completedTab);

		expect(screen.getByText('Completed 1')).toBeInTheDocument();
		expect(screen.queryByText('Active 1')).not.toBeInTheDocument();
	});

	it('should show empty state for filtered view with no matches', async () => {
		const mockScenes: BaseEntity[] = [
			createMockScene({ id: 'scene-1', fields: { status: 'planned' } })
		];

		mockGetAll.mockResolvedValue(mockScenes);
		render(SceneListPage);

		const completedTab = await screen.findByRole('tab', { name: /completed/i });
		await fireEvent.click(completedTab);

		expect(screen.getByText(/no.*completed.*scenes/i)).toBeInTheDocument();
	});

	it('should highlight active tab', async () => {
		mockGetAll.mockResolvedValue([]);
		render(SceneListPage);

		const plannedTab = await screen.findByRole('tab', { name: /planned/i });
		await fireEvent.click(plannedTab);

		expect(plannedTab).toHaveAttribute('aria-selected', 'true');
	});
});

describe('Scene List Page - Campaign Filtering', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should only show scenes from current campaign', async () => {
		const mockScenes: BaseEntity[] = [
			createMockScene({ id: 'scene-1', name: 'Current Campaign Scene', metadata: { campaignId: mockCampaignId } }),
			createMockScene({ id: 'scene-2', name: 'Other Campaign Scene', metadata: { campaignId: 'other-campaign' } })
		];

		mockGetAll.mockResolvedValue(mockScenes);
		render(SceneListPage);

		await screen.findByText('Current Campaign Scene');
		expect(screen.getByText('Current Campaign Scene')).toBeInTheDocument();
		expect(screen.queryByText('Other Campaign Scene')).not.toBeInTheDocument();
	});

	it('should handle scenes without campaignId gracefully', async () => {
		const mockScenes: BaseEntity[] = [
			createMockScene({ id: 'scene-1', name: 'Valid Scene', metadata: { campaignId: mockCampaignId } }),
			createMockScene({ id: 'scene-2', name: 'No Campaign', metadata: {} })
		];

		mockGetAll.mockResolvedValue(mockScenes);
		render(SceneListPage);

		await screen.findByText('Valid Scene');
		// Should not crash, may or may not show scenes without campaignId
		expect(screen.getByText('Valid Scene')).toBeInTheDocument();
	});
});

describe('Scene List Page - New Scene Creation', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockGetAll.mockResolvedValue([]);
	});

	it('should navigate to new scene form when "New Scene" clicked', async () => {
		render(SceneListPage);

		const newButton = screen.getByRole('button', { name: /new scene/i });
		await fireEvent.click(newButton);

		expect(goto).toHaveBeenCalledWith('/entities/scene/new');
	});

	it('should have prominent styling for new scene button', () => {
		render(SceneListPage);

		const newButton = screen.getByRole('button', { name: /new scene/i });
		expect(newButton).toHaveClass(/primary|bg-blue|bg-indigo/i);
	});
});

describe('Scene List Page - Loading State', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should show loading indicator while fetching scenes', () => {
		mockGetAll.mockImplementation(() => new Promise(() => {})); // Never resolves

		render(SceneListPage);

		expect(screen.getByText(/loading|fetching/i)).toBeInTheDocument();
	});

	it('should hide loading indicator after scenes load', async () => {
		const mockScenes: BaseEntity[] = [
			createMockScene({ id: 'scene-1', name: 'Test' })
		];

		mockGetAll.mockResolvedValue(mockScenes);
		render(SceneListPage);

		await screen.findByText('Test');
		expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
	});
});

describe('Scene List Page - Scene Order', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should order scenes by most recently updated first', async () => {
		const mockScenes: BaseEntity[] = [
			createMockScene({ id: 'scene-1', name: 'Older', updatedAt: new Date('2024-01-01') }),
			createMockScene({ id: 'scene-2', name: 'Newer', updatedAt: new Date('2024-01-15') }),
			createMockScene({ id: 'scene-3', name: 'Newest', updatedAt: new Date('2024-01-20') })
		];

		mockGetAll.mockResolvedValue(mockScenes);
		render(SceneListPage);

		await screen.findByText('Newest');
		const cards = screen.getAllByTestId('scene-card');

		// First card should be the newest
		expect(within(cards[0]).getByText('Newest')).toBeInTheDocument();
		expect(within(cards[2]).getByText('Older')).toBeInTheDocument();
	});
});
