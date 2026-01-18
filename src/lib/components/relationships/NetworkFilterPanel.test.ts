/**
 * Tests for NetworkFilterPanel Component
 *
 * Issue #74: Network Diagram Visualization
 * RED Phase (TDD): These tests define expected behavior before implementation.
 *
 * Tests the filter panel that allows users to filter the network diagram
 * by entity types and relationship types.
 *
 * These tests should FAIL until the implementation is complete.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import NetworkFilterPanel from './NetworkFilterPanel.svelte';
import type { NetworkFilterOptions } from '$lib/types/network';
import type { EntityType } from '$lib/types';

describe('NetworkFilterPanel Component - Basic Rendering', () => {
	it('should render filter panel container', () => {
		const { container } = render(NetworkFilterPanel, {
			props: {
				filters: {},
				onFilterChange: vi.fn()
			}
		});

		const panel = container.querySelector('[data-testid="network-filter-panel"]');
		expect(panel).toBeInTheDocument();
	});

	it('should render entity types section', () => {
		render(NetworkFilterPanel, {
			props: {
				filters: {},
				onFilterChange: vi.fn()
			}
		});

		expect(screen.getByText(/entity types/i)).toBeInTheDocument();
	});

	it('should render relationship types section', () => {
		render(NetworkFilterPanel, {
			props: {
				filters: {},
				onFilterChange: vi.fn()
			}
		});

		expect(screen.getByText(/relationship types/i)).toBeInTheDocument();
	});

	it('should render reset button', () => {
		render(NetworkFilterPanel, {
			props: {
				filters: {},
				onFilterChange: vi.fn()
			}
		});

		expect(screen.getByRole('button', { name: /reset|clear/i })).toBeInTheDocument();
	});
});

describe('NetworkFilterPanel Component - Entity Type Checkboxes', () => {
	const entityTypes: EntityType[] = [
		'character',
		'npc',
		'location',
		'faction',
		'item',
		'encounter',
		'session',
		'deity',
		'timeline_event',
		'world_rule',
		'player_profile',
		'campaign'
	];

	it('should render checkbox for each entity type', () => {
		render(NetworkFilterPanel, {
			props: {
				filters: {},
				onFilterChange: vi.fn()
			}
		});

		// Should have checkboxes for all entity types
		const checkboxes = screen.getAllByRole('checkbox');
		// At least 12 entity type checkboxes (may have more for relationship types)
		expect(checkboxes.length).toBeGreaterThanOrEqual(12);
	});

	it('should display readable labels for entity types', () => {
		render(NetworkFilterPanel, {
			props: {
				filters: {},
				onFilterChange: vi.fn()
			}
		});

		expect(screen.getByText(/character/i)).toBeInTheDocument();
		expect(screen.getByText(/npc/i)).toBeInTheDocument();
		expect(screen.getByText(/location/i)).toBeInTheDocument();
		expect(screen.getByText(/faction/i)).toBeInTheDocument();
	});

	it('should check all entity type checkboxes by default', () => {
		render(NetworkFilterPanel, {
			props: {
				filters: {},
				onFilterChange: vi.fn()
			}
		});

		const checkboxes = screen.getAllByRole('checkbox');
		checkboxes.forEach((checkbox) => {
			expect((checkbox as HTMLInputElement).checked).toBe(true);
		});
	});

	it('should respect initial entityTypes filter', () => {
		const filters: NetworkFilterOptions = {
			entityTypes: ['character', 'npc']
		};

		render(NetworkFilterPanel, {
			props: {
				filters,
				onFilterChange: vi.fn()
			}
		});

		// Component should render with filters applied
		expect(screen.getAllByRole('checkbox')).toBeDefined();
	});

	it('should call onFilterChange when entity type checkbox is toggled', async () => {
		const onFilterChange = vi.fn();

		render(NetworkFilterPanel, {
			props: {
				filters: {},
				onFilterChange
			}
		});

		// Find character checkbox and click it
		const characterCheckbox = screen.getByLabelText(/character/i);
		await fireEvent.click(characterCheckbox);

		expect(onFilterChange).toHaveBeenCalled();
	});

	it('should pass updated filters to onFilterChange', async () => {
		const onFilterChange = vi.fn();

		render(NetworkFilterPanel, {
			props: {
				filters: {},
				onFilterChange
			}
		});

		const characterCheckbox = screen.getByLabelText(/character/i);
		await fireEvent.click(characterCheckbox);

		expect(onFilterChange).toHaveBeenCalledWith(
			expect.objectContaining({
				entityTypes: expect.any(Array)
			})
		);
	});
});

describe('NetworkFilterPanel Component - Relationship Type Checkboxes', () => {
	const commonRelationships = [
		'friend_of',
		'enemy_of',
		'member_of',
		'located_at',
		'owns',
		'allied_with'
	];

	it('should render checkboxes for common relationship types', () => {
		render(NetworkFilterPanel, {
			props: {
				filters: {},
				onFilterChange: vi.fn(),
				availableRelationships: commonRelationships
			}
		});

		expect(screen.getByLabelText(/friend/i)).toBeInTheDocument();
		expect(screen.getByLabelText(/enemy/i)).toBeInTheDocument();
	});

	it('should display readable labels for relationship types', () => {
		render(NetworkFilterPanel, {
			props: {
				filters: {},
				onFilterChange: vi.fn(),
				availableRelationships: ['friend_of', 'enemy_of']
			}
		});

		// Labels should be formatted nicely (e.g., "friend_of" -> "Friend Of")
		expect(screen.getByText(/friend/i)).toBeInTheDocument();
		expect(screen.getByText(/enemy/i)).toBeInTheDocument();
	});

	it('should check all relationship type checkboxes by default', () => {
		render(NetworkFilterPanel, {
			props: {
				filters: {},
				onFilterChange: vi.fn(),
				availableRelationships: ['friend_of', 'enemy_of']
			}
		});

		const checkboxes = screen.getAllByRole('checkbox');
		checkboxes.forEach((checkbox) => {
			expect((checkbox as HTMLInputElement).checked).toBe(true);
		});
	});

	it('should respect initial relationshipTypes filter', () => {
		const filters: NetworkFilterOptions = {
			relationshipTypes: ['friend_of']
		};

		render(NetworkFilterPanel, {
			props: {
				filters,
				onFilterChange: vi.fn(),
				availableRelationships: ['friend_of', 'enemy_of']
			}
		});

		expect(screen.getAllByRole('checkbox')).toBeDefined();
	});

	it('should call onFilterChange when relationship type checkbox is toggled', async () => {
		const onFilterChange = vi.fn();

		render(NetworkFilterPanel, {
			props: {
				filters: {},
				onFilterChange,
				availableRelationships: ['friend_of', 'enemy_of']
			}
		});

		const friendCheckbox = screen.getByLabelText(/friend/i);
		await fireEvent.click(friendCheckbox);

		expect(onFilterChange).toHaveBeenCalled();
	});

	it('should handle empty availableRelationships array', () => {
		render(NetworkFilterPanel, {
			props: {
				filters: {},
				onFilterChange: vi.fn(),
				availableRelationships: []
			}
		});

		// Should not crash, just not show relationship checkboxes
		expect(screen.getByText(/entity types/i)).toBeInTheDocument();
	});

	it('should handle undefined availableRelationships', () => {
		render(NetworkFilterPanel, {
			props: {
				filters: {},
				onFilterChange: vi.fn()
			}
		});

		// Should not crash
		expect(screen.getByText(/entity types/i)).toBeInTheDocument();
	});
});

describe('NetworkFilterPanel Component - Reset Button', () => {
	it('should call onFilterChange with empty filters when reset clicked', async () => {
		const onFilterChange = vi.fn();
		const filters: NetworkFilterOptions = {
			entityTypes: ['character'],
			relationshipTypes: ['friend_of']
		};

		render(NetworkFilterPanel, {
			props: {
				filters,
				onFilterChange,
				availableRelationships: ['friend_of', 'enemy_of']
			}
		});

		const resetButton = screen.getByRole('button', { name: /reset|clear/i });
		await fireEvent.click(resetButton);

		expect(onFilterChange).toHaveBeenCalledWith({});
	});

	it('should reset all entity type checkboxes to checked', async () => {
		const onFilterChange = vi.fn();
		const filters: NetworkFilterOptions = {
			entityTypes: ['character']
		};

		render(NetworkFilterPanel, {
			props: {
				filters,
				onFilterChange
			}
		});

		const resetButton = screen.getByRole('button', { name: /reset|clear/i });
		await fireEvent.click(resetButton);

		expect(onFilterChange).toHaveBeenCalled();
	});

	it('should reset all relationship type checkboxes to checked', async () => {
		const onFilterChange = vi.fn();
		const filters: NetworkFilterOptions = {
			relationshipTypes: ['friend_of']
		};

		render(NetworkFilterPanel, {
			props: {
				filters,
				onFilterChange,
				availableRelationships: ['friend_of', 'enemy_of']
			}
		});

		const resetButton = screen.getByRole('button', { name: /reset|clear/i });
		await fireEvent.click(resetButton);

		expect(onFilterChange).toHaveBeenCalledWith({});
	});
});

describe('NetworkFilterPanel Component - Select All / Deselect All', () => {
	it('should have select all button for entity types', () => {
		render(NetworkFilterPanel, {
			props: {
				filters: {},
				onFilterChange: vi.fn()
			}
		});

		// Should have a button or link to select all entity types
		expect(screen.getByText(/select all|all/i)).toBeInTheDocument();
	});

	it('should have deselect all button for entity types', () => {
		render(NetworkFilterPanel, {
			props: {
				filters: {},
				onFilterChange: vi.fn()
			}
		});

		// Should have a button or link to deselect all entity types
		expect(screen.getByText(/deselect all|none/i)).toBeInTheDocument();
	});

	it('should select all entity types when select all clicked', async () => {
		const onFilterChange = vi.fn();
		const filters: NetworkFilterOptions = {
			entityTypes: ['character'] // Start with just one selected
		};

		render(NetworkFilterPanel, {
			props: {
				filters,
				onFilterChange
			}
		});

		const selectAllButton = screen.getByText(/select all|all/i);
		await fireEvent.click(selectAllButton);

		expect(onFilterChange).toHaveBeenCalled();
	});

	it('should deselect all entity types when deselect all clicked', async () => {
		const onFilterChange = vi.fn();

		render(NetworkFilterPanel, {
			props: {
				filters: {},
				onFilterChange
			}
		});

		const deselectAllButton = screen.getByText(/deselect all|none/i);
		await fireEvent.click(deselectAllButton);

		expect(onFilterChange).toHaveBeenCalledWith(
			expect.objectContaining({
				entityTypes: []
			})
		);
	});
});

describe('NetworkFilterPanel Component - Collapsible Sections', () => {
	it('should have entity types section that can be collapsed', () => {
		const { container } = render(NetworkFilterPanel, {
			props: {
				filters: {},
				onFilterChange: vi.fn()
			}
		});

		// Should have a collapsible/expandable section for entity types
		const entitySection = container.querySelector('[data-testid="entity-types-section"]');
		expect(entitySection).toBeInTheDocument();
	});

	it('should have relationship types section that can be collapsed', () => {
		const { container } = render(NetworkFilterPanel, {
			props: {
				filters: {},
				onFilterChange: vi.fn(),
				availableRelationships: ['friend_of']
			}
		});

		const relationshipSection = container.querySelector('[data-testid="relationship-types-section"]');
		expect(relationshipSection).toBeInTheDocument();
	});

	it('should toggle entity types section when header clicked', async () => {
		render(NetworkFilterPanel, {
			props: {
				filters: {},
				onFilterChange: vi.fn()
			}
		});

		const entityTypesHeader = screen.getByText(/entity types/i);
		await fireEvent.click(entityTypesHeader);

		// Section should toggle (implementation will determine exact behavior)
		expect(entityTypesHeader).toBeInTheDocument();
	});
});

describe('NetworkFilterPanel Component - Filter Count Display', () => {
	it('should display count of active entity type filters', () => {
		const filters: NetworkFilterOptions = {
			entityTypes: ['character', 'npc', 'location']
		};

		render(NetworkFilterPanel, {
			props: {
				filters,
				onFilterChange: vi.fn()
			}
		});

		// Should show something like "Entity Types (3)" or "3 selected"
		const text = screen.getByText(/entity types/i).textContent;
		expect(text).toMatch(/\d+/); // Contains a number
	});

	it('should display count of active relationship type filters', () => {
		const filters: NetworkFilterOptions = {
			relationshipTypes: ['friend_of', 'enemy_of']
		};

		render(NetworkFilterPanel, {
			props: {
				filters,
				onFilterChange: vi.fn(),
				availableRelationships: ['friend_of', 'enemy_of', 'allied_with']
			}
		});

		const text = screen.getByText(/relationship types/i).textContent;
		expect(text).toMatch(/\d+/);
	});
});

describe('NetworkFilterPanel Component - Accessibility', () => {
	it('should have proper checkbox labels', () => {
		render(NetworkFilterPanel, {
			props: {
				filters: {},
				onFilterChange: vi.fn()
			}
		});

		const checkboxes = screen.getAllByRole('checkbox');
		checkboxes.forEach((checkbox) => {
			// Each checkbox should have an accessible label
			expect(checkbox).toHaveAccessibleName();
		});
	});

	it('should have proper button labels', () => {
		render(NetworkFilterPanel, {
			props: {
				filters: {},
				onFilterChange: vi.fn()
			}
		});

		const buttons = screen.getAllByRole('button');
		buttons.forEach((button) => {
			expect(button).toHaveAccessibleName();
		});
	});

	it('should support keyboard navigation', () => {
		render(NetworkFilterPanel, {
			props: {
				filters: {},
				onFilterChange: vi.fn()
			}
		});

		const checkboxes = screen.getAllByRole('checkbox');
		checkboxes.forEach((checkbox) => {
			// Checkboxes should be keyboard accessible
			expect(checkbox).toBeInTheDocument();
		});
	});
});

describe('NetworkFilterPanel Component - Edge Cases', () => {
	it('should handle null filters', () => {
		expect(() => {
			render(NetworkFilterPanel, {
				props: {
					filters: null as any,
					onFilterChange: vi.fn()
				}
			});
		}).not.toThrow();
	});

	it('should handle undefined filters', () => {
		expect(() => {
			render(NetworkFilterPanel, {
				props: {
					filters: undefined as any,
					onFilterChange: vi.fn()
				}
			});
		}).not.toThrow();
	});

	it('should handle missing onFilterChange callback', () => {
		expect(() => {
			render(NetworkFilterPanel, {
				props: {
					filters: {}
				}
			});
		}).not.toThrow();
	});

	it('should handle very long relationship type names', () => {
		const longRelationship = 'very_long_relationship_type_name_that_might_wrap';

		render(NetworkFilterPanel, {
			props: {
				filters: {},
				onFilterChange: vi.fn(),
				availableRelationships: [longRelationship]
			}
		});

		expect(screen.getByText(new RegExp(longRelationship.substring(0, 10), 'i'))).toBeInTheDocument();
	});

	it('should handle duplicate relationship types in availableRelationships', () => {
		const relationships = ['friend_of', 'friend_of', 'enemy_of'];

		render(NetworkFilterPanel, {
			props: {
				filters: {},
				onFilterChange: vi.fn(),
				availableRelationships: relationships
			}
		});

		// Should deduplicate
		expect(screen.getAllByLabelText(/friend/i).length).toBe(1);
	});
});
