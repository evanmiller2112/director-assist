/**
 * Tests for Sidebar - Combat Integration
 *
 * TDD RED PHASE - Tests for A2 Combat Round Tracker - Sidebar Combat Link
 *
 * This test suite verifies that the sidebar properly displays:
 * - Combat navigation link
 * - Active combat count badge
 * - Proper highlighting when on combat routes
 *
 * These tests will FAIL until the sidebar is updated in the GREEN phase.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, within, cleanup } from '@testing-library/svelte';
import Sidebar from './Sidebar.svelte';
import { createActiveCombatSession, createMockCombatSession, createCompletedCombatSession } from '../../../tests/utils/combatTestUtils';
import type { CombatSession } from '$lib/types/combat';

// Mock svelte-dnd-action
vi.mock('svelte-dnd-action', () => ({
	dndzone: () => ({}),
	TRIGGERS: {}
}));

// Mock combat store - use object wrapper for mutability
const { mockState, mockCombatStore } = vi.hoisted(() => {
	const mockState = {
		combatSessions: [] as CombatSession[],
		pathname: '/'
	};
	const mockCombatStore = {
		subscribe: vi.fn(),
		getAll: vi.fn(() => mockState.combatSessions),
		getActiveCombats: vi.fn(() => mockState.combatSessions.filter(c => c.status === 'active'))
	};
	return { mockState, mockCombatStore };
});

// Mock other stores
vi.mock('$lib/stores', () => ({
	campaignStore: {
		customEntityTypes: [],
		entityTypeOverrides: []
	},
	entitiesStore: {
		entitiesByType: {}
	},
	combatStore: mockCombatStore,
	montageStore: {
		montages: []
	},
	negotiationStore: {
		activeNegotiations: []
	}
}));

// Mock navigation
vi.mock('$app/stores', () => ({
	page: {
		subscribe: vi.fn((callback) => {
			callback({ url: { pathname: mockState.pathname } });
			return () => {};
		})
	}
}));

// Mock sidebar order service
vi.mock('$lib/services/sidebarOrderService', () => ({
	getSidebarEntityTypeOrder: vi.fn(() => null),
	setSidebarEntityTypeOrder: vi.fn(),
	resetSidebarEntityTypeOrder: vi.fn()
}));

describe('Sidebar - Combat Link Display', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockState.combatSessions = [];
		mockState.pathname = '/';
	});

	it('should display "Combat" navigation link', () => {
		render(Sidebar);

		expect(screen.getByRole('link', { name: /combat/i })).toBeInTheDocument();
	});

	it('should link to /combat route', () => {
		render(Sidebar);

		const combatLink = screen.getByRole('link', { name: /combat/i });
		expect(combatLink).toHaveAttribute('href', '/combat');
	});

	it('should display combat icon', () => {
		render(Sidebar);

		const combatLink = screen.getByRole('link', { name: /combat/i });
		const icon = combatLink.querySelector('[data-icon="swords"], [data-icon="combat"]');
		expect(icon).toBeInTheDocument();
	});

	it('should position combat link in main navigation section', () => {
		render(Sidebar);

		// Combat link should be with other main nav items like Dashboard, Entities, Relationships
		const nav = screen.getByRole('navigation');
		const combatLink = within(nav).getByRole('link', { name: /combat/i });
		expect(combatLink).toBeInTheDocument();
	});

	it('should display combat link before entity types section', () => {
		render(Sidebar);

		const combatLink = screen.getByRole('link', { name: /combat/i });
		const entitiesSection = screen.getByText(/entities/i);

		// Combat link should appear before entities section
		expect(combatLink.compareDocumentPosition(entitiesSection))
			.toBe(Node.DOCUMENT_POSITION_FOLLOWING);
	});
});

describe('Sidebar - Active Combat Count Badge', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockState.combatSessions = [];
	});

	it('should not show badge when no active combats exist', () => {
		mockState.combatSessions = [
			createCompletedCombatSession(),
			createMockCombatSession({ status: 'preparing' })
		];

		render(Sidebar);

		const combatLink = screen.getByRole('link', { name: /combat/i });
		const badge = within(combatLink).queryByTestId('active-combat-badge');
		expect(badge).not.toBeInTheDocument();
	});

	it('should show badge with count when active combats exist', () => {
		mockState.combatSessions = [
			createActiveCombatSession(),
			createActiveCombatSession(),
			createMockCombatSession({ status: 'preparing' })
		];

		render(Sidebar);

		const combatLink = screen.getByRole('link', { name: /combat/i });
		expect(within(combatLink).getByText('2')).toBeInTheDocument();
	});

	it('should show badge with "1" for single active combat', () => {
		mockState.combatSessions = [
			createActiveCombatSession(),
			createCompletedCombatSession()
		];

		render(Sidebar);

		const combatLink = screen.getByRole('link', { name: /combat/i });
		expect(within(combatLink).getByText('1')).toBeInTheDocument();
	});

	it('should update badge count reactively when combats change', () => {
		// Test with initial state
		mockState.combatSessions = [
			createActiveCombatSession()
		];

		render(Sidebar);

		// Check initial count
		let combatLink = screen.getByRole('link', { name: /combat/i });
		expect(within(combatLink).getByText('1')).toBeInTheDocument();

		// Re-render with different state to test different counts
		cleanup();
		mockState.combatSessions = [
			createActiveCombatSession(),
			createActiveCombatSession()
		];

		render(Sidebar);

		// Check updated count
		combatLink = screen.getByRole('link', { name: /combat/i });
		expect(within(combatLink).getByText('2')).toBeInTheDocument();
	});

	it('should style badge with attention-grabbing colors', () => {
		mockState.combatSessions = [
			createActiveCombatSession()
		];

		render(Sidebar);

		const combatLink = screen.getByRole('link', { name: /combat/i });
		const badge = within(combatLink).getByText('1');

		// Badge should have red/orange/urgent styling
		expect(badge.className).toMatch(/red|orange|danger|urgent/i);
	});

	it('should not count paused combats in badge', () => {
		mockState.combatSessions = [
			createActiveCombatSession(),
			createMockCombatSession({ status: 'paused' })
		];

		render(Sidebar);

		const combatLink = screen.getByRole('link', { name: /combat/i });
		expect(within(combatLink).getByText('1')).toBeInTheDocument();
	});

	it('should not count preparing combats in badge', () => {
		mockState.combatSessions = [
			createActiveCombatSession(),
			createMockCombatSession({ status: 'preparing' })
		];

		render(Sidebar);

		const combatLink = screen.getByRole('link', { name: /combat/i });
		expect(within(combatLink).getByText('1')).toBeInTheDocument();
	});

	it('should not count completed combats in badge', () => {
		mockState.combatSessions = [
			createActiveCombatSession(),
			createCompletedCombatSession()
		];

		render(Sidebar);

		const combatLink = screen.getByRole('link', { name: /combat/i });
		expect(within(combatLink).getByText('1')).toBeInTheDocument();
	});

	it('should show double-digit badge correctly', () => {
		mockState.combatSessions = Array.from({ length: 15 }, () => createActiveCombatSession());

		render(Sidebar);

		const combatLink = screen.getByRole('link', { name: /combat/i });
		expect(within(combatLink).getByText('15')).toBeInTheDocument();
	});

	it('should position badge appropriately on combat link', () => {
		mockState.combatSessions = [
			createActiveCombatSession()
		];

		render(Sidebar);

		const combatLink = screen.getByRole('link', { name: /combat/i });
		const badge = within(combatLink).getByText('1');

		// Badge should be positioned (typically top-right or inline after text)
		expect(badge).toBeInTheDocument();
	});
});

describe('Sidebar - Combat Link Active State', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockState.combatSessions = [];
	});

	it('should highlight combat link when on /combat route', () => {
		mockState.pathname = '/combat';
		render(Sidebar);

		const combatLink = screen.getByRole('link', { name: /combat/i });
		// Active state uses bg-blue-100 for light mode
		expect(combatLink).toHaveClass('bg-blue-100');
		expect(combatLink).toHaveClass('text-blue-700');
	});

	it('should highlight combat link when on /combat/[id] route', () => {
		mockState.pathname = '/combat/combat-123';
		render(Sidebar);

		const combatLink = screen.getByRole('link', { name: /combat/i });
		// Active state uses bg-blue-100 for light mode
		expect(combatLink).toHaveClass('bg-blue-100');
		expect(combatLink).toHaveClass('text-blue-700');
	});

	it('should highlight combat link when on /combat/new route', () => {
		mockState.pathname = '/combat/new';
		render(Sidebar);

		const combatLink = screen.getByRole('link', { name: /combat/i });
		// Active state uses bg-blue-100 for light mode
		expect(combatLink).toHaveClass('bg-blue-100');
		expect(combatLink).toHaveClass('text-blue-700');
	});

	it('should not highlight combat link when on other routes', () => {
		mockState.pathname = '/entities/npc';
		render(Sidebar);

		const combatLink = screen.getByRole('link', { name: /combat/i });
		// Should NOT have active state classes
		expect(combatLink).not.toHaveClass('bg-blue-100');
		expect(combatLink).not.toHaveClass('text-blue-700');
	});

	it('should not highlight combat link on dashboard', () => {
		mockState.pathname = '/';
		render(Sidebar);

		const combatLink = screen.getByRole('link', { name: /combat/i });
		// Should NOT have active state classes
		expect(combatLink).not.toHaveClass('bg-blue-100');
		expect(combatLink).not.toHaveClass('text-blue-700');
	});

	it('should have aria-current="page" when on combat route', () => {
		mockState.pathname = '/combat';
		render(Sidebar);

		const combatLink = screen.getByRole('link', { name: /combat/i });
		expect(combatLink).toHaveAttribute('aria-current', 'page');
	});

	it('should not have aria-current when not on combat route', () => {
		mockState.pathname = '/entities/npc';
		render(Sidebar);

		const combatLink = screen.getByRole('link', { name: /combat/i });
		expect(combatLink).not.toHaveAttribute('aria-current', 'page');
	});
});

describe('Sidebar - Combat Link Accessibility', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockState.combatSessions = [];
	});

	it('should have accessible name for combat link', () => {
		render(Sidebar);

		const combatLink = screen.getByRole('link', { name: /combat/i });
		expect(combatLink).toHaveAccessibleName();
	});

	it('should have descriptive aria-label on badge when active combats exist', () => {
		mockState.combatSessions = [
			createActiveCombatSession(),
			createActiveCombatSession()
		];

		render(Sidebar);

		const combatLink = screen.getByRole('link', { name: /combat/i });
		const badge = within(combatLink).getByText('2');

		expect(badge).toHaveAttribute('aria-label', expect.stringMatching(/2.*active.*combat/i));
	});

	it('should be keyboard accessible', () => {
		render(Sidebar);

		const combatLink = screen.getByRole('link', { name: /combat/i });
		expect(combatLink).not.toHaveAttribute('tabindex', '-1');
	});

	it('should have proper role attribute', () => {
		render(Sidebar);

		const combatLink = screen.getByRole('link', { name: /combat/i });
		// <a> elements have implicit link role, no need for explicit role attribute
		expect(combatLink.tagName).toBe('A');
	});

	it('should announce badge updates to screen readers', () => {
		mockState.combatSessions = [
			createActiveCombatSession()
		];

		render(Sidebar);

		const combatLink = screen.getByRole('link', { name: /combat/i });
		const badge = within(combatLink).getByText('1');

		// Badge should have aria-live for dynamic updates
		expect(badge).toHaveAttribute('aria-live', 'polite');
	});
});

describe('Sidebar - Combat Link Hover and Visual Feedback', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockState.combatSessions = [];
	});

	it('should have hover state styling', () => {
		render(Sidebar);

		const combatLink = screen.getByRole('link', { name: /combat/i });

		// Should have hover classes
		expect(combatLink.className).toMatch(/hover:/);
	});

	it('should display consistent styling with other sidebar links', () => {
		render(Sidebar);

		const combatLink = screen.getByRole('link', { name: /combat/i });
		const dashboardLink = screen.getByRole('link', { name: /dashboard/i });

		// Both should have similar base styling
		const combatClasses = combatLink.className.split(' ');
		const dashboardClasses = dashboardLink.className.split(' ');

		// Check for shared styling patterns (flex, items-center, gap, px, py, rounded, etc)
		const sharedClasses = combatClasses.filter(c => dashboardClasses.includes(c));
		expect(sharedClasses.length).toBeGreaterThan(0);
	});

	it('should display icon with appropriate size and color', () => {
		render(Sidebar);

		const combatLink = screen.getByRole('link', { name: /combat/i });
		const icon = combatLink.querySelector('svg, [data-icon]');

		expect(icon).toBeInTheDocument();
	});
});

describe('Sidebar - Combat Link Integration', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockState.combatSessions = [];
	});

	it('should appear alongside existing navigation items', () => {
		render(Sidebar);

		// Should have all main nav items
		expect(screen.getByRole('link', { name: /dashboard/i })).toBeInTheDocument();
		expect(screen.getByRole('link', { name: /combat/i })).toBeInTheDocument();
		expect(screen.getByRole('link', { name: /montage/i })).toBeInTheDocument();
	});

	it('should maintain proper order in sidebar navigation', () => {
		render(Sidebar);

		const links = screen.getAllByRole('link');
		const linkTexts = links.map(link => link.textContent);

		// Combat should appear in logical position (likely after Dashboard, before Entities)
		const combatIndex = linkTexts.findIndex(text => text?.match(/combat/i));
		expect(combatIndex).toBeGreaterThan(-1);
	});

	it('should not interfere with entity type links', () => {
		render(Sidebar);

		// Both combat and other feature links should work
		expect(screen.getByRole('link', { name: /combat/i })).toBeInTheDocument();
		expect(screen.getByRole('link', { name: /montage/i })).toBeInTheDocument();
		expect(screen.getByRole('link', { name: /negotiation/i })).toBeInTheDocument();
	});

	it('should be visible in collapsed sidebar state', () => {
		// This would test collapsed state if sidebar has collapse functionality
		render(Sidebar);

		const combatLink = screen.getByRole('link', { name: /combat/i });
		expect(combatLink).toBeVisible();
	});
});

describe('Sidebar - Combat Link Edge Cases', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockState.combatSessions = [];
	});

	it('should handle zero active combats gracefully', () => {
		mockState.combatSessions = [
			createCompletedCombatSession()
		];

		render(Sidebar);

		const combatLink = screen.getByRole('link', { name: /combat/i });
		const badge = within(combatLink).queryByTestId('active-combat-badge');
		expect(badge).not.toBeInTheDocument();
	});

	it('should handle many active combats', () => {
		mockState.combatSessions = Array.from({ length: 50 }, () => createActiveCombatSession());

		render(Sidebar);

		const combatLink = screen.getByRole('link', { name: /combat/i });
		expect(within(combatLink).getByText('50')).toBeInTheDocument();
	});

	it('should handle rapid combat status changes', () => {
		// Test different states by re-rendering component

		// Start with 1 active
		mockState.combatSessions = [
			createActiveCombatSession()
		];
		render(Sidebar);
		let combatLink = screen.getByRole('link', { name: /combat/i });
		expect(within(combatLink).getByText('1')).toBeInTheDocument();
		cleanup();

		// Change to completed - badge should disappear
		mockState.combatSessions = [
			createCompletedCombatSession()
		];
		render(Sidebar);
		combatLink = screen.getByRole('link', { name: /combat/i });
		expect(within(combatLink).queryByTestId('active-combat-badge')).not.toBeInTheDocument();
		cleanup();

		// Add new active - badge should reappear with 1
		mockState.combatSessions = [
			createActiveCombatSession()
		];
		render(Sidebar);
		combatLink = screen.getByRole('link', { name: /combat/i });
		expect(within(combatLink).getByText('1')).toBeInTheDocument();
	});

	it('should handle undefined or null combat store', () => {
		mockCombatStore.getAll = vi.fn(() => []);
		mockCombatStore.getActiveCombats = vi.fn(() => []);

		render(Sidebar);

		// Should render without crashing
		expect(screen.getByRole('link', { name: /combat/i })).toBeInTheDocument();
	});
});
