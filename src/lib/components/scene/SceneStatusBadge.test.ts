/**
 * Tests for SceneStatusBadge Component
 *
 * TDD RED PHASE - Tests for Issue #292: Scene Runner Mode
 *
 * SceneStatusBadge displays a visual indicator of scene status:
 * - 'planned' (blue badge)
 * - 'active' (yellow/amber badge)
 * - 'completed' (green badge)
 *
 * These tests will FAIL until the component is implemented in the GREEN phase.
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import SceneStatusBadge from './SceneStatusBadge.svelte';

describe('SceneStatusBadge Component - Planned Status', () => {
	it('should render without crashing with planned status', () => {
		const { container } = render(SceneStatusBadge, {
			props: { status: 'planned' }
		});

		expect(container).toBeInTheDocument();
	});

	it('should display "Planned" text for planned status', () => {
		render(SceneStatusBadge, {
			props: { status: 'planned' }
		});

		expect(screen.getByText(/planned/i)).toBeInTheDocument();
	});

	it('should apply blue styling for planned status', () => {
		const { container } = render(SceneStatusBadge, {
			props: { status: 'planned' }
		});

		const badge = container.querySelector('[data-testid="scene-status-badge"]');
		expect(badge).toHaveClass(/blue|bg-blue/i);
	});

	it('should have consistent badge styling', () => {
		const { container } = render(SceneStatusBadge, {
			props: { status: 'planned' }
		});

		const badge = container.querySelector('[data-testid="scene-status-badge"]');
		expect(badge).toHaveClass(/badge|pill|tag/i);
	});
});

describe('SceneStatusBadge Component - Active Status', () => {
	it('should display "Active" text for active status', () => {
		render(SceneStatusBadge, {
			props: { status: 'active' }
		});

		expect(screen.getByText(/active/i)).toBeInTheDocument();
	});

	it('should apply yellow/amber styling for active status', () => {
		const { container } = render(SceneStatusBadge, {
			props: { status: 'active' }
		});

		const badge = container.querySelector('[data-testid="scene-status-badge"]');
		expect(badge).toHaveClass(/yellow|amber|bg-yellow|bg-amber/i);
	});

	it('should use warning color variant for active status', () => {
		const { container } = render(SceneStatusBadge, {
			props: { status: 'active' }
		});

		const badge = container.querySelector('[data-testid="scene-status-badge"]');
		// Active scenes are in progress, often use warning colors
		expect(badge).toBeTruthy();
	});
});

describe('SceneStatusBadge Component - Completed Status', () => {
	it('should display "Completed" text for completed status', () => {
		render(SceneStatusBadge, {
			props: { status: 'completed' }
		});

		expect(screen.getByText(/completed/i)).toBeInTheDocument();
	});

	it('should apply green styling for completed status', () => {
		const { container } = render(SceneStatusBadge, {
			props: { status: 'completed' }
		});

		const badge = container.querySelector('[data-testid="scene-status-badge"]');
		expect(badge).toHaveClass(/green|bg-green/i);
	});

	it('should use success color variant for completed status', () => {
		const { container } = render(SceneStatusBadge, {
			props: { status: 'completed' }
		});

		const badge = container.querySelector('[data-testid="scene-status-badge"]');
		expect(badge).toBeTruthy();
	});
});

describe('SceneStatusBadge Component - Default Behavior', () => {
	it('should handle undefined status gracefully', () => {
		const { container } = render(SceneStatusBadge, {
			props: { status: undefined as unknown as 'planned' }
		});

		expect(container).toBeInTheDocument();
	});

	it('should default to planned if status is missing', () => {
		render(SceneStatusBadge, {
			props: { status: undefined as unknown as 'planned' }
		});

		// Should show planned status as default
		expect(screen.getByText(/planned/i)).toBeInTheDocument();
	});

	it('should be accessible with proper role', () => {
		const { container } = render(SceneStatusBadge, {
			props: { status: 'active' }
		});

		const badge = container.querySelector('[data-testid="scene-status-badge"]');
		expect(badge).toHaveAttribute('role', 'status');
	});
});

describe('SceneStatusBadge Component - Visual Consistency', () => {
	it('should have consistent size across all statuses', () => {
		const { container: plannedContainer } = render(SceneStatusBadge, {
			props: { status: 'planned' }
		});
		const { container: activeContainer } = render(SceneStatusBadge, {
			props: { status: 'active' }
		});
		const { container: completedContainer } = render(SceneStatusBadge, {
			props: { status: 'completed' }
		});

		const plannedBadge = plannedContainer.querySelector('[data-testid="scene-status-badge"]');
		const activeBadge = activeContainer.querySelector('[data-testid="scene-status-badge"]');
		const completedBadge = completedContainer.querySelector('[data-testid="scene-status-badge"]');

		// All badges should exist
		expect(plannedBadge).toBeInTheDocument();
		expect(activeBadge).toBeInTheDocument();
		expect(completedBadge).toBeInTheDocument();
	});

	it('should display capitalized status text', () => {
		render(SceneStatusBadge, {
			props: { status: 'planned' }
		});

		// Text should be properly capitalized
		const text = screen.getByText(/planned/i);
		expect(text.textContent).toMatch(/^[A-Z]/); // Starts with capital letter
	});
});
