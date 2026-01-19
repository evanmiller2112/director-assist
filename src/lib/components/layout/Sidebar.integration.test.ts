/**
 * Integration Tests for Sidebar with Custom Entity Types (TDD RED Phase - Issue #25)
 *
 * Phase 5: Sidebar and Navigation Integration
 *
 * These tests verify that custom entity types are properly integrated into the sidebar
 * navigation. Tests should FAIL until sidebar integration is implemented.
 *
 * Test Coverage:
 * - Custom entity types appear in sidebar with correct icons and colors
 * - Entity counts show for custom types
 * - Sidebar respects showInSidebar setting from type overrides (hiddenFromSidebar)
 * - Custom types maintain proper ordering
 * - Integration with existing built-in types
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import Sidebar from './Sidebar.svelte';
import { campaignStore } from '$lib/stores';
import type { EntityTypeDefinition, EntityTypeOverride } from '$lib/types';

// Mock svelte-dnd-action
vi.mock('svelte-dnd-action', () => ({
	dndzone: () => ({}),
	TRIGGERS: {}
}));

// Mock stores
vi.mock('$lib/stores', () => ({
	campaignStore: {
		customEntityTypes: [],
		entityTypeOverrides: []
	},
	entitiesStore: {
		entitiesByType: {}
	}
}));

// Mock navigation
vi.mock('$app/stores', () => ({
	page: {
		subscribe: vi.fn((callback) => {
			callback({ url: { pathname: '/' } });
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

describe('Sidebar - Custom Entity Types Integration', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('Custom Entity Type Display', () => {
		it('should display custom entity type in sidebar', () => {
			const customType: EntityTypeDefinition = {
				type: 'quest',
				label: 'Quest',
				labelPlural: 'Quests',
				icon: 'scroll',
				color: 'purple',
				isBuiltIn: false,
				fieldDefinitions: [],
				defaultRelationships: []
			};

			// Mock campaign store with custom type
			vi.mocked(campaignStore).customEntityTypes = [customType];

			render(Sidebar);

			// Custom type should appear in sidebar
			expect(screen.getByText('Quests')).toBeInTheDocument();
		});

		it('should display multiple custom entity types', () => {
			const customTypes: EntityTypeDefinition[] = [
				{
					type: 'quest',
					label: 'Quest',
					labelPlural: 'Quests',
					icon: 'scroll',
					color: 'purple',
					isBuiltIn: false,
					fieldDefinitions: [],
					defaultRelationships: []
				},
				{
					type: 'shop',
					label: 'Shop',
					labelPlural: 'Shops',
					icon: 'store',
					color: 'amber',
					isBuiltIn: false,
					fieldDefinitions: [],
					defaultRelationships: []
				}
			];

			vi.mocked(campaignStore).customEntityTypes = customTypes;

			render(Sidebar);

			expect(screen.getByText('Quests')).toBeInTheDocument();
			expect(screen.getByText('Shops')).toBeInTheDocument();
		});

		it('should display custom entity types alongside built-in types', () => {
			const customType: EntityTypeDefinition = {
				type: 'quest',
				label: 'Quest',
				labelPlural: 'Quests',
				icon: 'scroll',
				color: 'purple',
				isBuiltIn: false,
				fieldDefinitions: [],
				defaultRelationships: []
			};

			vi.mocked(campaignStore).customEntityTypes = [customType];

			render(Sidebar);

			// Built-in types should still appear
			expect(screen.getByText('Player Characters')).toBeInTheDocument();
			expect(screen.getByText('NPCs')).toBeInTheDocument();

			// Custom type should also appear
			expect(screen.getByText('Quests')).toBeInTheDocument();
		});
	});

	describe('Custom Entity Type Icons and Colors', () => {
		it('should render custom entity type with correct icon', () => {
			const customType: EntityTypeDefinition = {
				type: 'quest',
				label: 'Quest',
				labelPlural: 'Quests',
				icon: 'scroll',
				color: 'purple',
				isBuiltIn: false,
				fieldDefinitions: [],
				defaultRelationships: []
			};

			vi.mocked(campaignStore).customEntityTypes = [customType];

			const { container } = render(Sidebar);

			// Icon should be rendered (implementation-specific test)
			// We can check that the icon component is rendered
			const questLink = screen.getByText('Quests').closest('a');
			expect(questLink).toBeInTheDocument();

			// The icon should be a child of the link
			// Exact verification depends on icon library implementation
		});

		it('should apply custom color to entity type icon', () => {
			const customType: EntityTypeDefinition = {
				type: 'quest',
				label: 'Quest',
				labelPlural: 'Quests',
				icon: 'scroll',
				color: 'purple',
				isBuiltIn: false,
				fieldDefinitions: [],
				defaultRelationships: []
			};

			vi.mocked(campaignStore).customEntityTypes = [customType];

			const { container } = render(Sidebar);

			// Check that color is applied via CSS variable
			const questLink = screen.getByText('Quests').closest('a');
			expect(questLink).toBeInTheDocument();

			// Color should be applied to icon via style attribute
			// Exact selector depends on icon implementation
			const iconElement = questLink?.querySelector('[style*="color"]');
			expect(iconElement).toBeInTheDocument();
		});

		it('should handle different color values', () => {
			const customTypes: EntityTypeDefinition[] = [
				{
					type: 'quest',
					label: 'Quest',
					labelPlural: 'Quests',
					icon: 'scroll',
					color: 'purple',
					isBuiltIn: false,
					fieldDefinitions: [],
					defaultRelationships: []
				},
				{
					type: 'shop',
					label: 'Shop',
					labelPlural: 'Shops',
					icon: 'store',
					color: 'amber',
					isBuiltIn: false,
					fieldDefinitions: [],
					defaultRelationships: []
				}
			];

			vi.mocked(campaignStore).customEntityTypes = customTypes;

			render(Sidebar);

			// Both types should render with their respective colors
			const questLink = screen.getByText('Quests').closest('a');
			const shopLink = screen.getByText('Shops').closest('a');

			expect(questLink).toBeInTheDocument();
			expect(shopLink).toBeInTheDocument();
		});
	});

	describe('Entity Counts for Custom Types', () => {
		it('should show entity count for custom type with entities', () => {
			const customType: EntityTypeDefinition = {
				type: 'quest',
				label: 'Quest',
				labelPlural: 'Quests',
				icon: 'scroll',
				color: 'purple',
				isBuiltIn: false,
				fieldDefinitions: [],
				defaultRelationships: []
			};

			vi.mocked(campaignStore).customEntityTypes = [customType];

			// Mock entities store with quest entities
			const { entitiesStore } = require('$lib/stores');
			entitiesStore.entitiesByType = {
				quest: [{}, {}, {}] // 3 quest entities
			};

			render(Sidebar);

			// Count badge should show 3
			expect(screen.getByText('3')).toBeInTheDocument();
		});

		it('should not show count badge when custom type has zero entities', () => {
			const customType: EntityTypeDefinition = {
				type: 'quest',
				label: 'Quest',
				labelPlural: 'Quests',
				icon: 'scroll',
				color: 'purple',
				isBuiltIn: false,
				fieldDefinitions: [],
				defaultRelationships: []
			};

			vi.mocked(campaignStore).customEntityTypes = [customType];

			const { entitiesStore } = require('$lib/stores');
			entitiesStore.entitiesByType = {
				quest: [] // No entities
			};

			render(Sidebar);

			// Count badge should not appear when count is 0
			// Check that no count badge is near the "Quests" link
			const questLink = screen.getByText('Quests').closest('a');
			expect(questLink).toBeInTheDocument();

			// No count badge should be present (implementation-specific)
		});

		it('should show different counts for multiple custom types', () => {
			const customTypes: EntityTypeDefinition[] = [
				{
					type: 'quest',
					label: 'Quest',
					labelPlural: 'Quests',
					icon: 'scroll',
					color: 'purple',
					isBuiltIn: false,
					fieldDefinitions: [],
					defaultRelationships: []
				},
				{
					type: 'shop',
					label: 'Shop',
					labelPlural: 'Shops',
					icon: 'store',
					color: 'amber',
					isBuiltIn: false,
					fieldDefinitions: [],
					defaultRelationships: []
				}
			];

			vi.mocked(campaignStore).customEntityTypes = customTypes;

			const { entitiesStore } = require('$lib/stores');
			entitiesStore.entitiesByType = {
				quest: [{}, {}], // 2 quests
				shop: [{}, {}, {}, {}] // 4 shops
			};

			render(Sidebar);

			expect(screen.getByText('2')).toBeInTheDocument();
			expect(screen.getByText('4')).toBeInTheDocument();
		});
	});

	describe('Type Override - Hidden From Sidebar', () => {
		it('should hide built-in type when hiddenFromSidebar is true', () => {
			const override: EntityTypeOverride = {
				type: 'player_profile',
				hiddenFromSidebar: true
			};

			vi.mocked(campaignStore).entityTypeOverrides = [override];

			render(Sidebar);

			// Player Profiles should not appear in sidebar
			expect(screen.queryByText('Player Profiles')).not.toBeInTheDocument();
		});

		it('should show built-in type when hiddenFromSidebar is false', () => {
			const override: EntityTypeOverride = {
				type: 'character',
				hiddenFromSidebar: false
			};

			vi.mocked(campaignStore).entityTypeOverrides = [override];

			render(Sidebar);

			// Player Characters should still appear
			expect(screen.getByText('Player Characters')).toBeInTheDocument();
		});

		it('should show built-in type when no override exists', () => {
			vi.mocked(campaignStore).entityTypeOverrides = [];

			render(Sidebar);

			// All default types should appear
			expect(screen.getByText('Player Characters')).toBeInTheDocument();
			expect(screen.getByText('NPCs')).toBeInTheDocument();
		});

		it('should hide multiple types with overrides', () => {
			const overrides: EntityTypeOverride[] = [
				{
					type: 'player_profile',
					hiddenFromSidebar: true
				},
				{
					type: 'world_rule',
					hiddenFromSidebar: true
				}
			];

			vi.mocked(campaignStore).entityTypeOverrides = overrides;

			render(Sidebar);

			expect(screen.queryByText('Player Profiles')).not.toBeInTheDocument();
			expect(screen.queryByText('World Rules')).not.toBeInTheDocument();

			// Other types should still appear
			expect(screen.getByText('Player Characters')).toBeInTheDocument();
		});
	});

	describe('Custom Type Navigation', () => {
		it('should create correct navigation link for custom type', () => {
			const customType: EntityTypeDefinition = {
				type: 'quest',
				label: 'Quest',
				labelPlural: 'Quests',
				icon: 'scroll',
				color: 'purple',
				isBuiltIn: false,
				fieldDefinitions: [],
				defaultRelationships: []
			};

			vi.mocked(campaignStore).customEntityTypes = [customType];

			render(Sidebar);

			const questLink = screen.getByText('Quests').closest('a');
			expect(questLink).toHaveAttribute('href', '/entities/quest');
		});

		it('should create links for multiple custom types', () => {
			const customTypes: EntityTypeDefinition[] = [
				{
					type: 'quest',
					label: 'Quest',
					labelPlural: 'Quests',
					icon: 'scroll',
					color: 'purple',
					isBuiltIn: false,
					fieldDefinitions: [],
					defaultRelationships: []
				},
				{
					type: 'shop',
					label: 'Shop',
					labelPlural: 'Shops',
					icon: 'store',
					color: 'amber',
					isBuiltIn: false,
					fieldDefinitions: [],
					defaultRelationships: []
				}
			];

			vi.mocked(campaignStore).customEntityTypes = customTypes;

			render(Sidebar);

			const questLink = screen.getByText('Quests').closest('a');
			const shopLink = screen.getByText('Shops').closest('a');

			expect(questLink).toHaveAttribute('href', '/entities/quest');
			expect(shopLink).toHaveAttribute('href', '/entities/shop');
		});
	});

	describe('Sidebar Ordering with Custom Types', () => {
		it('should display custom types after built-in types by default', () => {
			const customType: EntityTypeDefinition = {
				type: 'quest',
				label: 'Quest',
				labelPlural: 'Quests',
				icon: 'scroll',
				color: 'purple',
				isBuiltIn: false,
				fieldDefinitions: [],
				defaultRelationships: []
			};

			vi.mocked(campaignStore).customEntityTypes = [customType];

			const { container } = render(Sidebar);

			// Get all entity type links
			const links = container.querySelectorAll('nav a');
			const linkTexts = Array.from(links).map((link) => link.textContent?.trim());

			// Custom types should appear after built-in types
			const questIndex = linkTexts.findIndex((text) => text?.includes('Quests'));
			const characterIndex = linkTexts.findIndex((text) => text?.includes('Player Characters'));

			expect(questIndex).toBeGreaterThan(characterIndex);
		});

		it('should maintain order of multiple custom types', () => {
			const customTypes: EntityTypeDefinition[] = [
				{
					type: 'quest',
					label: 'Quest',
					labelPlural: 'Quests',
					icon: 'scroll',
					color: 'purple',
					isBuiltIn: false,
					fieldDefinitions: [],
					defaultRelationships: []
				},
				{
					type: 'shop',
					label: 'Shop',
					labelPlural: 'Shops',
					icon: 'store',
					color: 'amber',
					isBuiltIn: false,
					fieldDefinitions: [],
					defaultRelationships: []
				}
			];

			vi.mocked(campaignStore).customEntityTypes = customTypes;

			const { container } = render(Sidebar);

			const links = container.querySelectorAll('nav a');
			const linkTexts = Array.from(links).map((link) => link.textContent?.trim());

			// Custom types should appear in the order they were defined
			const questIndex = linkTexts.findIndex((text) => text?.includes('Quests'));
			const shopIndex = linkTexts.findIndex((text) => text?.includes('Shops'));

			expect(questIndex).toBeLessThan(shopIndex);
		});
	});

	describe('Quick Add Modal Integration', () => {
		it('should include custom types in quick add modal', () => {
			// This test verifies that QuickAddModal receives custom types
			// The actual modal testing is in QuickAddModal.test.ts
			// Here we just verify the integration point

			const customType: EntityTypeDefinition = {
				type: 'quest',
				label: 'Quest',
				labelPlural: 'Quests',
				icon: 'scroll',
				color: 'purple',
				isBuiltIn: false,
				fieldDefinitions: [],
				defaultRelationships: []
			};

			vi.mocked(campaignStore).customEntityTypes = [customType];

			const { container } = render(Sidebar);

			// Quick Add button should exist
			const addButton = screen.getByText(/Add Entity/i);
			expect(addButton).toBeInTheDocument();

			// Note: Testing modal content requires opening the modal
			// which is covered in QuickAddModal.test.ts
		});
	});

	describe('Edge Cases', () => {
		it('should handle empty custom types array', () => {
			vi.mocked(campaignStore).customEntityTypes = [];

			render(Sidebar);

			// Should still render built-in types
			expect(screen.getByText('Player Characters')).toBeInTheDocument();
			expect(screen.getByText('NPCs')).toBeInTheDocument();
		});

		it('should handle custom type with very long label', () => {
			const customType: EntityTypeDefinition = {
				type: 'very_long_type',
				label: 'Quest',
				labelPlural: 'Very Long Custom Entity Type With Many Words That Might Wrap',
				icon: 'scroll',
				color: 'purple',
				isBuiltIn: false,
				fieldDefinitions: [],
				defaultRelationships: []
			};

			vi.mocked(campaignStore).customEntityTypes = [customType];

			render(Sidebar);

			// Should render without breaking layout
			expect(
				screen.getByText('Very Long Custom Entity Type With Many Words That Might Wrap')
			).toBeInTheDocument();
		});

		it('should handle custom type with special characters in label', () => {
			const customType: EntityTypeDefinition = {
				type: 'special_quest',
				label: 'Quest',
				labelPlural: 'Quests & Missions (Special)',
				icon: 'scroll',
				color: 'purple',
				isBuiltIn: false,
				fieldDefinitions: [],
				defaultRelationships: []
			};

			vi.mocked(campaignStore).customEntityTypes = [customType];

			render(Sidebar);

			expect(screen.getByText('Quests & Missions (Special)')).toBeInTheDocument();
		});

		it('should update when custom types are added dynamically', () => {
			vi.mocked(campaignStore).customEntityTypes = [];

			const { rerender } = render(Sidebar);

			// Initially no custom types
			expect(screen.queryByText('Quests')).not.toBeInTheDocument();

			// Add custom type
			const customType: EntityTypeDefinition = {
				type: 'quest',
				label: 'Quest',
				labelPlural: 'Quests',
				icon: 'scroll',
				color: 'purple',
				isBuiltIn: false,
				fieldDefinitions: [],
				defaultRelationships: []
			};

			vi.mocked(campaignStore).customEntityTypes = [customType];
			rerender({});

			// Should now show custom type
			expect(screen.getByText('Quests')).toBeInTheDocument();
		});
	});
});
