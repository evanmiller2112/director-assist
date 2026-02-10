/**
 * Tests for SceneHeader Component
 *
 * TDD RED PHASE - Tests for Issue #292: Scene Runner Mode
 *
 * SceneHeader displays scene information and control buttons:
 * - Scene name
 * - Status badge
 * - Edit button (navigate to edit page)
 * - Back button
 * - Complete scene button (for active scenes)
 *
 * These tests will FAIL until the component is implemented in the GREEN phase.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import SceneHeader from './SceneHeader.svelte';
import { goto } from '$app/navigation';

// Mock navigation
vi.mock('$app/navigation', () => ({
	goto: vi.fn()
}));

describe('SceneHeader Component - Basic Rendering', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should render without crashing', () => {
		const { container } = render(SceneHeader, {
			props: {
				sceneId: 'scene-1',
				sceneName: 'Test Scene',
				status: 'planned'
			}
		});

		expect(container).toBeInTheDocument();
	});

	it('should display scene name', () => {
		render(SceneHeader, {
			props: {
				sceneId: 'scene-1',
				sceneName: 'The Dragon Encounter',
				status: 'in_progress'
			}
		});

		expect(screen.getByText('The Dragon Encounter')).toBeInTheDocument();
	});

	it('should display scene name as heading', () => {
		render(SceneHeader, {
			props: {
				sceneId: 'scene-1',
				sceneName: 'My Scene',
				status: 'planned'
			}
		});

		expect(screen.getByRole('heading', { name: /my scene/i })).toBeInTheDocument();
	});

	it('should display status badge', () => {
		const { container } = render(SceneHeader, {
			props: {
				sceneId: 'scene-1',
				sceneName: 'Test',
				status: 'in_progress'
			}
		});

		const badge = container.querySelector('[data-testid="scene-status-badge"]');
		expect(badge).toBeInTheDocument();
	});

	it('should pass correct status to status badge', () => {
		render(SceneHeader, {
			props: {
				sceneId: 'scene-1',
				sceneName: 'Test',
				status: 'completed'
			}
		});

		expect(screen.getByText(/completed/i)).toBeInTheDocument();
	});
});

describe('SceneHeader Component - Back Button', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should display back button', () => {
		render(SceneHeader, {
			props: {
				sceneId: 'scene-1',
				sceneName: 'Test',
				status: 'in_progress'
			}
		});

		expect(screen.getByRole('button', { name: /back|return/i })).toBeInTheDocument();
	});

	it('should navigate to scene list when back clicked', async () => {
		render(SceneHeader, {
			props: {
				sceneId: 'scene-1',
				sceneName: 'Test',
				status: 'in_progress'
			}
		});

		const backButton = screen.getByRole('button', { name: /back|return/i });
		await fireEvent.click(backButton);

		expect(goto).toHaveBeenCalledWith('/scene');
	});

	it('should have proper icon for back button', () => {
		const { container } = render(SceneHeader, {
			props: {
				sceneId: 'scene-1',
				sceneName: 'Test',
				status: 'in_progress'
			}
		});

		const backButton = screen.getByRole('button', { name: /back|return/i });
		// Should contain an icon (svg or icon class)
		expect(backButton.querySelector('svg') || backButton.querySelector('[class*="icon"]')).toBeTruthy();
	});
});

describe('SceneHeader Component - Edit Button', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should display edit button', () => {
		render(SceneHeader, {
			props: {
				sceneId: 'scene-1',
				sceneName: 'Test',
				status: 'in_progress'
			}
		});

		expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument();
	});

	it('should navigate to entity edit page when edit clicked', async () => {
		render(SceneHeader, {
			props: {
				sceneId: 'scene-123',
				sceneName: 'Test',
				status: 'in_progress'
			}
		});

		const editButton = screen.getByRole('button', { name: /edit/i });
		await fireEvent.click(editButton);

		// BUG FIX #419: Should navigate to correct edit route with /edit suffix
		expect(goto).toHaveBeenCalledWith('/entities/scene/scene-123/edit');
	});

	it('should have proper icon for edit button', () => {
		const { container } = render(SceneHeader, {
			props: {
				sceneId: 'scene-1',
				sceneName: 'Test',
				status: 'in_progress'
			}
		});

		const editButton = screen.getByRole('button', { name: /edit/i });
		expect(editButton.querySelector('svg') || editButton.querySelector('[class*="icon"]')).toBeTruthy();
	});

	// BUG FIX #419: Additional tests for correct edit route construction
	it('should navigate to correct edit route for different scene IDs', async () => {
		const testCases = [
			{ sceneId: 'test-scene-1', expectedRoute: '/entities/scene/test-scene-1/edit' },
			{ sceneId: 'abc-123-xyz', expectedRoute: '/entities/scene/abc-123-xyz/edit' },
			{ sceneId: '12345', expectedRoute: '/entities/scene/12345/edit' }
		];

		for (const { sceneId, expectedRoute } of testCases) {
			vi.clearAllMocks();

			const { unmount } = render(SceneHeader, {
				props: {
					sceneId,
					sceneName: 'Test Scene',
					status: 'planned'
				}
			});

			const editButton = screen.getByRole('button', { name: /edit/i });
			await fireEvent.click(editButton);

			expect(goto).toHaveBeenCalledWith(expectedRoute);

			unmount();
		}
	});

	it('should navigate to edit route for all scene statuses', async () => {
		const statuses: Array<'planned' | 'in_progress' | 'completed'> = ['planned', 'in_progress', 'completed'];

		for (const status of statuses) {
			vi.clearAllMocks();

			const { unmount } = render(SceneHeader, {
				props: {
					sceneId: 'scene-456',
					sceneName: 'Test Scene',
					status
				}
			});

			const editButton = screen.getByRole('button', { name: /edit/i });
			await fireEvent.click(editButton);

			// Edit button should work the same regardless of scene status
			expect(goto).toHaveBeenCalledWith('/entities/scene/scene-456/edit');

			unmount();
		}
	});
});

describe('SceneHeader Component - Complete Scene Button', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should display complete button when scene is active', () => {
		render(SceneHeader, {
			props: {
				sceneId: 'scene-1',
				sceneName: 'Test',
				status: 'in_progress'
			}
		});

		expect(screen.getByRole('button', { name: /complete.*scene/i })).toBeInTheDocument();
	});

	it('should not display complete button when scene is planned', () => {
		render(SceneHeader, {
			props: {
				sceneId: 'scene-1',
				sceneName: 'Test',
				status: 'planned'
			}
		});

		expect(screen.queryByRole('button', { name: /complete.*scene/i })).not.toBeInTheDocument();
	});

	it('should not display complete button when scene is completed', () => {
		render(SceneHeader, {
			props: {
				sceneId: 'scene-1',
				sceneName: 'Test',
				status: 'completed'
			}
		});

		expect(screen.queryByRole('button', { name: /complete.*scene/i })).not.toBeInTheDocument();
	});

	it('should call onComplete callback when complete button clicked', async () => {
		const onComplete = vi.fn();
		render(SceneHeader, {
			props: {
				sceneId: 'scene-1',
				sceneName: 'Test',
				status: 'in_progress',
				onComplete
			}
		});

		const completeButton = screen.getByRole('button', { name: /complete.*scene/i });
		await fireEvent.click(completeButton);

		expect(onComplete).toHaveBeenCalled();
	});

	it('should style complete button as primary action', () => {
		render(SceneHeader, {
			props: {
				sceneId: 'scene-1',
				sceneName: 'Test',
				status: 'in_progress'
			}
		});

		const completeButton = screen.getByRole('button', { name: /complete.*scene/i });
		expect(completeButton).toHaveClass(/primary|bg-blue|bg-green|bg-indigo/i);
	});
});

describe('SceneHeader Component - Start Scene Button', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should display start button when scene is planned', () => {
		render(SceneHeader, {
			props: {
				sceneId: 'scene-1',
				sceneName: 'Test',
				status: 'planned'
			}
		});

		expect(screen.getByRole('button', { name: /start.*scene|run.*scene/i })).toBeInTheDocument();
	});

	it('should not display start button when scene is active', () => {
		render(SceneHeader, {
			props: {
				sceneId: 'scene-1',
				sceneName: 'Test',
				status: 'in_progress'
			}
		});

		expect(screen.queryByRole('button', { name: /start.*scene/i })).not.toBeInTheDocument();
	});

	it('should not display start button when scene is completed', () => {
		render(SceneHeader, {
			props: {
				sceneId: 'scene-1',
				sceneName: 'Test',
				status: 'completed'
			}
		});

		expect(screen.queryByRole('button', { name: /start.*scene/i })).not.toBeInTheDocument();
	});

	it('should call onStart callback when start button clicked', async () => {
		const onStart = vi.fn();
		render(SceneHeader, {
			props: {
				sceneId: 'scene-1',
				sceneName: 'Test',
				status: 'planned',
				onStart
			}
		});

		const startButton = screen.getByRole('button', { name: /start.*scene|run.*scene/i });
		await fireEvent.click(startButton);

		expect(onStart).toHaveBeenCalled();
	});
});

describe('SceneHeader Component - Layout', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should layout with back button on left', () => {
		const { container } = render(SceneHeader, {
			props: {
				sceneId: 'scene-1',
				sceneName: 'Test',
				status: 'in_progress'
			}
		});

		const header = container.querySelector('[data-testid="scene-header"]');
		const backButton = screen.getByRole('button', { name: /back/i });

		// Back button should be first or in left section
		expect(header?.firstElementChild?.contains(backButton)).toBe(true);
	});

	it('should group action buttons on right side', () => {
		const { container } = render(SceneHeader, {
			props: {
				sceneId: 'scene-1',
				sceneName: 'Test',
				status: 'in_progress'
			}
		});

		const editButton = screen.getByRole('button', { name: /edit/i });
		const completeButton = screen.getByRole('button', { name: /complete/i });

		// Buttons should be grouped together
		const editParent = editButton.parentElement;
		const completeParent = completeButton.parentElement;

		expect(editParent).toBe(completeParent);
	});

	it('should display scene name and status in center', () => {
		const { container } = render(SceneHeader, {
			props: {
				sceneId: 'scene-1',
				sceneName: 'Test Scene',
				status: 'in_progress'
			}
		});

		const header = container.querySelector('[data-testid="scene-header"]');
		const title = screen.getByRole('heading');
		const badge = container.querySelector('[data-testid="scene-status-badge"]');

		// Title and badge should be in a central section
		expect(header?.contains(title)).toBe(true);
		expect(header?.contains(badge as Element)).toBe(true);
	});
});

describe('SceneHeader Component - Accessibility', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should use header element for semantic structure', () => {
		const { container } = render(SceneHeader, {
			props: {
				sceneId: 'scene-1',
				sceneName: 'Test',
				status: 'in_progress'
			}
		});

		expect(container.querySelector('header')).toBeInTheDocument();
	});

	it('should have accessible labels for all buttons', () => {
		render(SceneHeader, {
			props: {
				sceneId: 'scene-1',
				sceneName: 'Test',
				status: 'in_progress'
			}
		});

		const backButton = screen.getByRole('button', { name: /back/i });
		const editButton = screen.getByRole('button', { name: /edit/i });
		const completeButton = screen.getByRole('button', { name: /complete/i });

		expect(backButton).toHaveAccessibleName();
		expect(editButton).toHaveAccessibleName();
		expect(completeButton).toHaveAccessibleName();
	});

	it('should support keyboard navigation', async () => {
		render(SceneHeader, {
			props: {
				sceneId: 'scene-1',
				sceneName: 'Test',
				status: 'in_progress'
			}
		});

		const buttons = screen.getAllByRole('button');

		// All buttons should be focusable
		buttons.forEach(button => {
			expect(button).not.toHaveAttribute('tabindex', '-1');
		});
	});
});
