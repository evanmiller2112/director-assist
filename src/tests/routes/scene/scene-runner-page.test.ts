/**
 * Tests for Scene Runner Page (/scene/[id])
 *
 * TDD RED PHASE - Tests for Issue #292: Scene Runner Mode
 *
 * This is the main Scene Runner interface where DMs run scenes.
 * Features:
 * - Display scene name and status
 * - Show scene setting in read-aloud box
 * - Display location and NPC context panels
 * - Capture "what happened" notes with auto-save
 * - Start scene (planned → active)
 * - Complete scene with modal
 * - Navigate back to scene list
 * - Edit scene
 *
 * These tests will FAIL until the page is implemented in the GREEN phase.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import SceneRunnerPage from '../../../routes/scene/[id]/+page.svelte';
import { goto } from '$app/navigation';
import { page } from '$app/stores';
import type { BaseEntity } from '$lib/types';

// Mock navigation
vi.mock('$app/navigation', () => ({
	goto: vi.fn()
}));

// Mock page store
const mockPageStore = {
	subscribe: vi.fn((callback) => {
		callback({ params: { id: 'scene-test-id' } });
		return () => {};
	})
};

vi.mock('$app/stores', () => ({
	page: mockPageStore
}));

// Mock entity repository
const mockGetById = vi.fn();
const mockUpdate = vi.fn();

vi.mock('$lib/db/entityRepository', () => ({
	entityRepository: {
		getById: mockGetById,
		update: mockUpdate
	}
}));

// Mock scene status service
const mockStartScene = vi.fn();
const mockCompleteScene = vi.fn();

vi.mock('$lib/services/sceneStatusService', () => ({
	startScene: mockStartScene,
	completeScene: mockCompleteScene
}));

// Helper to create mock scene
function createMockScene(overrides: Partial<BaseEntity> = {}): BaseEntity {
	return {
		id: 'scene-test-id',
		type: 'scene',
		name: 'Test Scene',
		description: 'A test scene description',
		tags: [],
		fields: {
			status: 'planned',
			setting: 'You enter a dimly lit tavern...',
			locationRef: undefined,
			npcRefs: [],
			whatHappened: ''
		},
		links: [],
		notes: '',
		createdAt: new Date(),
		updatedAt: new Date(),
		metadata: {},
		...overrides
	};
}

describe('Scene Runner Page - Basic Rendering', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should render without crashing', async () => {
		mockGetById.mockResolvedValue(createMockScene());

		const { container } = render(SceneRunnerPage);

		await screen.findByText('Test Scene');
		expect(container).toBeInTheDocument();
	});

	it('should load scene data on mount', async () => {
		const mockScene = createMockScene({ id: 'scene-123' });
		mockGetById.mockResolvedValue(mockScene);

		render(SceneRunnerPage);

		await waitFor(() => {
			expect(mockGetById).toHaveBeenCalledWith('scene-test-id');
		});
	});

	it('should display scene name in header', async () => {
		mockGetById.mockResolvedValue(createMockScene({ name: 'The Dragon Encounter' }));

		render(SceneRunnerPage);

		await screen.findByText('The Dragon Encounter');
		expect(screen.getByText('The Dragon Encounter')).toBeInTheDocument();
	});

	it('should display scene status badge', async () => {
		mockGetById.mockResolvedValue(createMockScene({ fields: { status: 'active' } }));

		render(SceneRunnerPage);

		await screen.findByText(/active/i);
		expect(screen.getByText(/active/i)).toBeInTheDocument();
	});

	it('should show error if scene not found', async () => {
		mockGetById.mockResolvedValue(null);

		render(SceneRunnerPage);

		await screen.findByText(/scene.*not.*found/i);
		expect(screen.getByText(/scene.*not.*found/i)).toBeInTheDocument();
	});

	it('should show error if entity is not a scene', async () => {
		const mockNpc: BaseEntity = {
			id: 'npc-1',
			type: 'npc',
			name: 'Guard',
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

		render(SceneRunnerPage);

		await screen.findByText(/not.*scene|invalid.*entity/i);
		expect(screen.getByText(/not.*scene|invalid.*entity/i)).toBeInTheDocument();
	});
});

describe('Scene Runner Page - Scene Setting Display', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should display scene setting text', async () => {
		mockGetById.mockResolvedValue(
			createMockScene({
				fields: {
					setting: 'The throne room is vast and imposing, with banners hanging from the walls.'
				}
			})
		);

		render(SceneRunnerPage);

		await screen.findByText(/throne room is vast/i);
		expect(screen.getByText(/throne room is vast/i)).toBeInTheDocument();
	});

	it('should display setting in styled read-aloud box', async () => {
		mockGetById.mockResolvedValue(
			createMockScene({
				fields: { setting: 'Test setting text' }
			})
		);

		const { container } = render(SceneRunnerPage);

		await screen.findByText('Test setting text');

		const settingContainer = container.querySelector('[data-testid="scene-setting-container"]');
		expect(settingContainer).toBeInTheDocument();
		expect(settingContainer).toHaveClass(/italic/i);
	});

	it('should show placeholder if setting is not defined', async () => {
		mockGetById.mockResolvedValue(
			createMockScene({
				fields: { setting: '' }
			})
		);

		render(SceneRunnerPage);

		await screen.findByText(/no setting/i);
		expect(screen.getByText(/no setting/i)).toBeInTheDocument();
	});
});

describe('Scene Runner Page - Context Display', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should display location context when locationRef is set', async () => {
		const mockLocation: BaseEntity = {
			id: 'location-1',
			type: 'location',
			name: 'The Tavern',
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
			if (id === 'scene-test-id') {
				return Promise.resolve(createMockScene({
					fields: { locationRef: 'location-1' }
				}));
			}
			if (id === 'location-1') {
				return Promise.resolve(mockLocation);
			}
			return Promise.resolve(null);
		});

		render(SceneRunnerPage);

		await screen.findByText('The Tavern');
		expect(screen.getByText('The Tavern')).toBeInTheDocument();
	});

	it('should display NPC context when npcRefs are set', async () => {
		const mockNpc: BaseEntity = {
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

		mockGetById.mockImplementation((id: string) => {
			if (id === 'scene-test-id') {
				return Promise.resolve(createMockScene({
					fields: { npcRefs: ['npc-1'] }
				}));
			}
			if (id === 'npc-1') {
				return Promise.resolve(mockNpc);
			}
			return Promise.resolve(null);
		});

		render(SceneRunnerPage);

		await screen.findByText('Gandalf');
		expect(screen.getByText('Gandalf')).toBeInTheDocument();
	});

	it('should show context panel with location and NPCs', async () => {
		mockGetById.mockResolvedValue(
			createMockScene({
				fields: {
					locationRef: 'location-1',
					npcRefs: ['npc-1', 'npc-2']
				}
			})
		);

		const { container } = render(SceneRunnerPage);

		await screen.findByText(/scene context/i);
		expect(screen.getByText(/scene context/i)).toBeInTheDocument();
	});
});

describe('Scene Runner Page - What Happened Notes', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('should display "What Happened" note capture section', async () => {
		mockGetById.mockResolvedValue(createMockScene());

		render(SceneRunnerPage);

		await screen.findByText(/what happened/i);
		expect(screen.getByText(/what happened/i)).toBeInTheDocument();
	});

	it('should show existing "what happened" notes', async () => {
		mockGetById.mockResolvedValue(
			createMockScene({
				fields: {
					whatHappened: 'Players defeated the bandits and saved the village.'
				}
			})
		);

		render(SceneRunnerPage);

		const textarea = await screen.findByRole('textbox');
		expect((textarea as HTMLTextAreaElement).value).toContain('defeated the bandits');
	});

	it('should allow editing "what happened" notes', async () => {
		const user = userEvent.setup({ delay: null });
		mockGetById.mockResolvedValue(createMockScene());

		render(SceneRunnerPage);

		const textarea = await screen.findByRole('textbox');
		await user.type(textarea, 'New notes about the scene');

		expect((textarea as HTMLTextAreaElement).value).toBe('New notes about the scene');
	});

	it('should auto-save notes after typing stops', async () => {
		const user = userEvent.setup({ delay: null });
		mockGetById.mockResolvedValue(createMockScene());
		mockUpdate.mockResolvedValue(undefined);

		render(SceneRunnerPage);

		const textarea = await screen.findByRole('textbox');
		await user.type(textarea, 'Auto-saved content');

		// Advance timers past debounce period
		vi.advanceTimersByTime(1500);

		await waitFor(() => {
			expect(mockUpdate).toHaveBeenCalledWith(
				'scene-test-id',
				expect.objectContaining({
					fields: expect.objectContaining({
						whatHappened: 'Auto-saved content'
					})
				})
			);
		});
	});

	it('should show save indicator after notes are saved', async () => {
		const user = userEvent.setup({ delay: null });
		mockGetById.mockResolvedValue(createMockScene());
		mockUpdate.mockResolvedValue(undefined);

		render(SceneRunnerPage);

		const textarea = await screen.findByRole('textbox');
		await user.type(textarea, 'Content');

		vi.advanceTimersByTime(1500);

		await waitFor(() => {
			expect(screen.getByText(/saved/i)).toBeInTheDocument();
		});
	});
});

describe('Scene Runner Page - Start Scene Action', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should show "Start Scene" button when status is planned', async () => {
		mockGetById.mockResolvedValue(
			createMockScene({ fields: { status: 'planned' } })
		);

		render(SceneRunnerPage);

		await screen.findByRole('button', { name: /start.*scene/i });
		expect(screen.getByRole('button', { name: /start.*scene/i })).toBeInTheDocument();
	});

	it('should not show "Start Scene" button when status is active', async () => {
		mockGetById.mockResolvedValue(
			createMockScene({ fields: { status: 'active' } })
		);

		render(SceneRunnerPage);

		await screen.findByText('Test Scene');
		expect(screen.queryByRole('button', { name: /start.*scene/i })).not.toBeInTheDocument();
	});

	it('should call startScene service when start button clicked', async () => {
		mockGetById.mockResolvedValue(
			createMockScene({ id: 'scene-456', fields: { status: 'planned' } })
		);
		mockStartScene.mockResolvedValue(undefined);

		render(SceneRunnerPage);

		const startButton = await screen.findByRole('button', { name: /start.*scene/i });
		await fireEvent.click(startButton);

		expect(mockStartScene).toHaveBeenCalledWith('scene-test-id');
	});

	it('should reload scene data after starting scene', async () => {
		mockGetById.mockResolvedValue(
			createMockScene({ fields: { status: 'planned' } })
		);
		mockStartScene.mockResolvedValue(undefined);

		render(SceneRunnerPage);

		const startButton = await screen.findByRole('button', { name: /start.*scene/i });
		await fireEvent.click(startButton);

		await waitFor(() => {
			// Should call getById at least twice: initial load + after start
			expect(mockGetById).toHaveBeenCalledTimes(2);
		});
	});

	it('should change status to active after starting scene', async () => {
		let callCount = 0;
		mockGetById.mockImplementation(() => {
			callCount++;
			if (callCount === 1) {
				return Promise.resolve(createMockScene({ fields: { status: 'planned' } }));
			}
			return Promise.resolve(createMockScene({ fields: { status: 'active' } }));
		});
		mockStartScene.mockResolvedValue(undefined);

		render(SceneRunnerPage);

		const startButton = await screen.findByRole('button', { name: /start.*scene/i });
		await fireEvent.click(startButton);

		await waitFor(() => {
			expect(screen.getByText(/active/i)).toBeInTheDocument();
		});
	});
});

describe('Scene Runner Page - Complete Scene Action', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should show "Complete Scene" button when status is active', async () => {
		mockGetById.mockResolvedValue(
			createMockScene({ fields: { status: 'active' } })
		);

		render(SceneRunnerPage);

		await screen.findByRole('button', { name: /complete.*scene/i });
		expect(screen.getByRole('button', { name: /complete.*scene/i })).toBeInTheDocument();
	});

	it('should not show "Complete Scene" button when status is planned', async () => {
		mockGetById.mockResolvedValue(
			createMockScene({ fields: { status: 'planned' } })
		);

		render(SceneRunnerPage);

		await screen.findByText('Test Scene');
		expect(screen.queryByRole('button', { name: /complete.*scene/i })).not.toBeInTheDocument();
	});

	it('should not show "Complete Scene" button when status is completed', async () => {
		mockGetById.mockResolvedValue(
			createMockScene({ fields: { status: 'completed' } })
		);

		render(SceneRunnerPage);

		await screen.findByText('Test Scene');
		expect(screen.queryByRole('button', { name: /complete.*scene/i })).not.toBeInTheDocument();
	});

	it('should open completion modal when complete button clicked', async () => {
		mockGetById.mockResolvedValue(
			createMockScene({ fields: { status: 'active' } })
		);

		render(SceneRunnerPage);

		const completeButton = await screen.findByRole('button', { name: /complete.*scene/i });
		await fireEvent.click(completeButton);

		await screen.findByRole('dialog');
		expect(screen.getByRole('dialog')).toBeInTheDocument();
	});

	it('should show scene name in completion modal', async () => {
		mockGetById.mockResolvedValue(
			createMockScene({ name: 'Epic Finale', fields: { status: 'active' } })
		);

		render(SceneRunnerPage);

		const completeButton = await screen.findByRole('button', { name: /complete.*scene/i });
		await fireEvent.click(completeButton);

		await screen.findByText(/complete.*epic finale/i);
		expect(screen.getByText(/complete.*epic finale/i)).toBeInTheDocument();
	});

	it('should call completeScene service when modal confirmed', async () => {
		mockGetById.mockResolvedValue(
			createMockScene({ fields: { status: 'active' } })
		);
		mockCompleteScene.mockResolvedValue(undefined);

		render(SceneRunnerPage);

		const completeButton = await screen.findByRole('button', { name: /complete.*scene/i });
		await fireEvent.click(completeButton);

		const confirmButton = await screen.findByRole('button', { name: /confirm/i });
		await fireEvent.click(confirmButton);

		expect(mockCompleteScene).toHaveBeenCalledWith('scene-test-id', expect.any(String));
	});

	it('should pass final notes to completeScene service', async () => {
		const user = userEvent.setup();
		mockGetById.mockResolvedValue(
			createMockScene({ fields: { status: 'active', whatHappened: 'Initial notes' } })
		);
		mockCompleteScene.mockResolvedValue(undefined);

		render(SceneRunnerPage);

		const completeButton = await screen.findByRole('button', { name: /complete.*scene/i });
		await fireEvent.click(completeButton);

		const modalTextarea = (await screen.findAllByRole('textbox'))[1]; // Modal textarea
		await user.clear(modalTextarea);
		await user.type(modalTextarea, 'Final summary of the scene');

		const confirmButton = await screen.findByRole('button', { name: /confirm/i });
		await fireEvent.click(confirmButton);

		expect(mockCompleteScene).toHaveBeenCalledWith('scene-test-id', 'Final summary of the scene');
	});

	it('should close modal when cancel clicked', async () => {
		mockGetById.mockResolvedValue(
			createMockScene({ fields: { status: 'active' } })
		);

		render(SceneRunnerPage);

		const completeButton = await screen.findByRole('button', { name: /complete.*scene/i });
		await fireEvent.click(completeButton);

		const cancelButton = await screen.findByRole('button', { name: /cancel/i });
		await fireEvent.click(cancelButton);

		expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
	});

	it('should reload scene data after completing scene', async () => {
		mockGetById.mockResolvedValue(
			createMockScene({ fields: { status: 'active' } })
		);
		mockCompleteScene.mockResolvedValue(undefined);

		render(SceneRunnerPage);

		const completeButton = await screen.findByRole('button', { name: /complete.*scene/i });
		await fireEvent.click(completeButton);

		const confirmButton = await screen.findByRole('button', { name: /confirm/i });
		await fireEvent.click(confirmButton);

		await waitFor(() => {
			// Should call getById multiple times: initial + after complete
			expect(mockGetById.mock.calls.length).toBeGreaterThan(1);
		});
	});
});

describe('Scene Runner Page - Navigation', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should navigate back to scene list when back button clicked', async () => {
		mockGetById.mockResolvedValue(createMockScene());

		render(SceneRunnerPage);

		const backButton = await screen.findByRole('button', { name: /back/i });
		await fireEvent.click(backButton);

		expect(goto).toHaveBeenCalledWith('/scene');
	});

	it('should navigate to edit page when edit button clicked', async () => {
		mockGetById.mockResolvedValue(createMockScene({ id: 'scene-789' }));

		render(SceneRunnerPage);

		const editButton = await screen.findByRole('button', { name: /edit/i });
		await fireEvent.click(editButton);

		expect(goto).toHaveBeenCalledWith('/entities/scene/scene-test-id');
	});
});

describe('Scene Runner Page - Loading State', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should show loading indicator while fetching scene', () => {
		mockGetById.mockImplementation(() => new Promise(() => {})); // Never resolves

		render(SceneRunnerPage);

		expect(screen.getByText(/loading/i)).toBeInTheDocument();
	});

	it('should hide loading indicator after scene loads', async () => {
		mockGetById.mockResolvedValue(createMockScene());

		render(SceneRunnerPage);

		await screen.findByText('Test Scene');
		expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
	});
});
