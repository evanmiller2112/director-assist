import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import RelationshipsFilter from './RelationshipsFilter.svelte';
import type { RelationshipFilterOptions } from '$lib/types/relationships';

/**
 * Tests for RelationshipsFilter Component
 *
 * Issue #76 Phase 1: Dedicated Relationships Management Page
 *
 * This component provides filtering UI for the relationships table,
 * allowing users to filter by relationship type, entity type, strength,
 * and search query.
 *
 * These tests are written in the RED phase of TDD - they will FAIL until
 * the component is implemented.
 */

describe('RelationshipsFilter Component - Rendering', () => {
	it('should render relationship type dropdown', () => {
		const availableRelationshipTypes = ['friend_of', 'member_of', 'knows'];

		render(RelationshipsFilter, {
			props: {
				filterOptions: {},
				availableRelationshipTypes,
				availableEntityTypes: [],
				onFilterChange: vi.fn()
			}
		});

		expect(screen.getByLabelText(/relationship type/i)).toBeInTheDocument();
	});

	it('should render entity type dropdown', () => {
		const availableEntityTypes = ['character', 'location', 'faction'];

		render(RelationshipsFilter, {
			props: {
				filterOptions: {},
				availableRelationshipTypes: [],
				availableEntityTypes,
				onFilterChange: vi.fn()
			}
		});

		expect(screen.getByLabelText(/entity type/i)).toBeInTheDocument();
	});

	it('should render strength dropdown', () => {
		render(RelationshipsFilter, {
			props: {
				filterOptions: {},
				availableRelationshipTypes: [],
				availableEntityTypes: [],
				onFilterChange: vi.fn()
			}
		});

		expect(screen.getByLabelText(/strength/i)).toBeInTheDocument();
	});

	it('should render search input', () => {
		render(RelationshipsFilter, {
			props: {
				filterOptions: {},
				availableRelationshipTypes: [],
				availableEntityTypes: [],
				onFilterChange: vi.fn()
			}
		});

		expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument();
	});
});

describe('RelationshipsFilter Component - Relationship Type Filter', () => {
	it('should display all available relationship types in dropdown', () => {
		const availableRelationshipTypes = ['friend_of', 'member_of', 'enemy_of'];

		render(RelationshipsFilter, {
			props: {
				filterOptions: {},
				availableRelationshipTypes,
				availableEntityTypes: [],
				onFilterChange: vi.fn()
			}
		});

		expect(screen.getByRole('option', { name: /friend_of/i })).toBeInTheDocument();
		expect(screen.getByRole('option', { name: /member_of/i })).toBeInTheDocument();
		expect(screen.getByRole('option', { name: /enemy_of/i })).toBeInTheDocument();
	});

	it('should include "All" option in relationship type dropdown', () => {
		render(RelationshipsFilter, {
			props: {
				filterOptions: {},
				availableRelationshipTypes: ['friend_of'],
				availableEntityTypes: [],
				onFilterChange: vi.fn()
			}
		});

		expect(screen.getByRole('option', { name: /all|any/i })).toBeInTheDocument();
	});

	it('should show current filter value for relationship type', () => {
		const filterOptions: RelationshipFilterOptions = {
			relationshipType: 'member_of'
		};

		render(RelationshipsFilter, {
			props: {
				filterOptions,
				availableRelationshipTypes: ['member_of', 'knows'],
				availableEntityTypes: [],
				onFilterChange: vi.fn()
			}
		});

		const select = screen.getByLabelText(/relationship type/i) as HTMLSelectElement;
		expect(select.value).toBe('member_of');
	});

	it('should call onFilterChange when relationship type is selected', async () => {
		const onFilterChange = vi.fn();

		render(RelationshipsFilter, {
			props: {
				filterOptions: {},
				availableRelationshipTypes: ['friend_of', 'member_of'],
				availableEntityTypes: [],
				onFilterChange
			}
		});

		const select = screen.getByLabelText(/relationship type/i);
		await fireEvent.change(select, { target: { value: 'friend_of' } });

		expect(onFilterChange).toHaveBeenCalledWith(
			expect.objectContaining({
				relationshipType: 'friend_of'
			})
		);
	});

	it('should handle empty relationship types list', () => {
		render(RelationshipsFilter, {
			props: {
				filterOptions: {},
				availableRelationshipTypes: [],
				availableEntityTypes: [],
				onFilterChange: vi.fn()
			}
		});

		const select = screen.getByLabelText(/relationship type/i);
		expect(select).toBeInTheDocument();
	});
});

describe('RelationshipsFilter Component - Entity Type Filter', () => {
	it('should display all available entity types in dropdown', () => {
		const availableEntityTypes = ['character', 'location', 'faction'];

		render(RelationshipsFilter, {
			props: {
				filterOptions: {},
				availableRelationshipTypes: [],
				availableEntityTypes,
				onFilterChange: vi.fn()
			}
		});

		expect(screen.getByRole('option', { name: /character/i })).toBeInTheDocument();
		expect(screen.getByRole('option', { name: /location/i })).toBeInTheDocument();
		expect(screen.getByRole('option', { name: /faction/i })).toBeInTheDocument();
	});

	it('should include "All" option in entity type dropdown', () => {
		render(RelationshipsFilter, {
			props: {
				filterOptions: {},
				availableRelationshipTypes: [],
				availableEntityTypes: ['character'],
				onFilterChange: vi.fn()
			}
		});

		expect(screen.getByRole('option', { name: /all/i })).toBeInTheDocument();
	});

	it('should show current filter value for entity type', () => {
		const filterOptions: RelationshipFilterOptions = {
			targetEntityType: 'faction'
		};

		render(RelationshipsFilter, {
			props: {
				filterOptions,
				availableRelationshipTypes: [],
				availableEntityTypes: ['character', 'faction'],
				onFilterChange: vi.fn()
			}
		});

		const select = screen.getByLabelText(/entity type/i) as HTMLSelectElement;
		expect(select.value).toBe('faction');
	});

	it('should call onFilterChange when entity type is selected', async () => {
		const onFilterChange = vi.fn();

		render(RelationshipsFilter, {
			props: {
				filterOptions: {},
				availableRelationshipTypes: [],
				availableEntityTypes: ['character', 'location'],
				onFilterChange
			}
		});

		const select = screen.getByLabelText(/entity type/i);
		await fireEvent.change(select, { target: { value: 'location' } });

		expect(onFilterChange).toHaveBeenCalledWith(
			expect.objectContaining({
				targetEntityType: 'location'
			})
		);
	});
});

describe('RelationshipsFilter Component - Strength Filter', () => {
	it('should display all strength options', () => {
		render(RelationshipsFilter, {
			props: {
				filterOptions: {},
				availableRelationshipTypes: [],
				availableEntityTypes: [],
				onFilterChange: vi.fn()
			}
		});

		expect(screen.getByRole('option', { name: /all/i })).toBeInTheDocument();
		expect(screen.getByRole('option', { name: /strong/i })).toBeInTheDocument();
		expect(screen.getByRole('option', { name: /moderate/i })).toBeInTheDocument();
		expect(screen.getByRole('option', { name: /weak/i })).toBeInTheDocument();
	});

	it('should show current filter value for strength', () => {
		const filterOptions: RelationshipFilterOptions = {
			strength: 'strong'
		};

		render(RelationshipsFilter, {
			props: {
				filterOptions,
				availableRelationshipTypes: [],
				availableEntityTypes: [],
				onFilterChange: vi.fn()
			}
		});

		const select = screen.getByLabelText(/strength/i) as HTMLSelectElement;
		expect(select.value).toBe('strong');
	});

	it('should call onFilterChange when strength is selected', async () => {
		const onFilterChange = vi.fn();

		render(RelationshipsFilter, {
			props: {
				filterOptions: {},
				availableRelationshipTypes: [],
				availableEntityTypes: [],
				onFilterChange
			}
		});

		const select = screen.getByLabelText(/strength/i);
		await fireEvent.change(select, { target: { value: 'moderate' } });

		expect(onFilterChange).toHaveBeenCalledWith(
			expect.objectContaining({
				strength: 'moderate'
			})
		);
	});

	it('should default to "all" for strength', () => {
		render(RelationshipsFilter, {
			props: {
				filterOptions: {},
				availableRelationshipTypes: [],
				availableEntityTypes: [],
				onFilterChange: vi.fn()
			}
		});

		const select = screen.getByLabelText(/strength/i) as HTMLSelectElement;
		expect(select.value).toBe('all');
	});
});

describe('RelationshipsFilter Component - Search Input', () => {
	it('should show current search query', () => {
		const filterOptions: RelationshipFilterOptions = {
			searchQuery: 'gandalf'
		};

		render(RelationshipsFilter, {
			props: {
				filterOptions,
				availableRelationshipTypes: [],
				availableEntityTypes: [],
				onFilterChange: vi.fn()
			}
		});

		const input = screen.getByPlaceholderText(/search/i) as HTMLInputElement;
		expect(input.value).toBe('gandalf');
	});

	it('should call onFilterChange when search input changes', async () => {
		const onFilterChange = vi.fn();

		render(RelationshipsFilter, {
			props: {
				filterOptions: {},
				availableRelationshipTypes: [],
				availableEntityTypes: [],
				onFilterChange
			}
		});

		const input = screen.getByPlaceholderText(/search/i);
		await fireEvent.input(input, { target: { value: 'fellowship' } });

		expect(onFilterChange).toHaveBeenCalledWith(
			expect.objectContaining({
				searchQuery: 'fellowship'
			})
		);
	});

	it('should handle empty search query', async () => {
		const onFilterChange = vi.fn();

		render(RelationshipsFilter, {
			props: {
				filterOptions: { searchQuery: 'test' },
				availableRelationshipTypes: [],
				availableEntityTypes: [],
				onFilterChange
			}
		});

		const input = screen.getByPlaceholderText(/search/i);
		await fireEvent.input(input, { target: { value: '' } });

		expect(onFilterChange).toHaveBeenCalledWith(
			expect.objectContaining({
				searchQuery: ''
			})
		);
	});

	it('should have appropriate placeholder text', () => {
		render(RelationshipsFilter, {
			props: {
				filterOptions: {},
				availableRelationshipTypes: [],
				availableEntityTypes: [],
				onFilterChange: vi.fn()
			}
		});

		const input = screen.getByPlaceholderText(/search/i);
		expect(input).toHaveAttribute('placeholder', expect.stringMatching(/search/i));
	});
});

describe('RelationshipsFilter Component - Combined Filters', () => {
	it('should preserve all filters when one is changed', async () => {
		const onFilterChange = vi.fn();
		const initialFilters: RelationshipFilterOptions = {
			relationshipType: 'friend_of',
			targetEntityType: 'character',
			strength: 'strong',
			searchQuery: 'gandalf'
		};

		render(RelationshipsFilter, {
			props: {
				filterOptions: initialFilters,
				availableRelationshipTypes: ['friend_of', 'member_of'],
				availableEntityTypes: ['character', 'location'],
				onFilterChange
			}
		});

		const strengthSelect = screen.getByLabelText(/strength/i);
		await fireEvent.change(strengthSelect, { target: { value: 'moderate' } });

		expect(onFilterChange).toHaveBeenCalledWith(
			expect.objectContaining({
				relationshipType: 'friend_of',
				targetEntityType: 'character',
				strength: 'moderate',
				searchQuery: 'gandalf'
			})
		);
	});

	it('should allow clearing all filters', async () => {
		const onFilterChange = vi.fn();

		render(RelationshipsFilter, {
			props: {
				filterOptions: {
					relationshipType: 'friend_of',
					targetEntityType: 'character',
					strength: 'strong'
				},
				availableRelationshipTypes: ['friend_of'],
				availableEntityTypes: ['character'],
				onFilterChange
			}
		});

		const clearButton = screen.getByRole('button', { name: /clear|reset/i });
		await fireEvent.click(clearButton);

		expect(onFilterChange).toHaveBeenCalledWith({});
	});
});

describe('RelationshipsFilter Component - Accessibility', () => {
	it('should have proper labels for all inputs', () => {
		render(RelationshipsFilter, {
			props: {
				filterOptions: {},
				availableRelationshipTypes: ['friend_of'],
				availableEntityTypes: ['character'],
				onFilterChange: vi.fn()
			}
		});

		expect(screen.getByLabelText(/relationship type/i)).toHaveAccessibleName();
		expect(screen.getByLabelText(/entity type/i)).toHaveAccessibleName();
		expect(screen.getByLabelText(/strength/i)).toHaveAccessibleName();
	});

	it('should support keyboard navigation', () => {
		render(RelationshipsFilter, {
			props: {
				filterOptions: {},
				availableRelationshipTypes: [],
				availableEntityTypes: [],
				onFilterChange: vi.fn()
			}
		});

		const relationshipSelect = screen.getByLabelText(/relationship type/i);
		const entitySelect = screen.getByLabelText(/entity type/i);
		const strengthSelect = screen.getByLabelText(/strength/i);
		const searchInput = screen.getByPlaceholderText(/search/i);

		// All inputs should be tabbable
		expect(relationshipSelect.tagName).toBe('SELECT');
		expect(entitySelect.tagName).toBe('SELECT');
		expect(strengthSelect.tagName).toBe('SELECT');
		expect(searchInput.tagName).toBe('INPUT');
	});
});

describe('RelationshipsFilter Component - Edge Cases', () => {
	it('should handle undefined filterOptions gracefully', () => {
		render(RelationshipsFilter, {
			props: {
				filterOptions: undefined as any,
				availableRelationshipTypes: [],
				availableEntityTypes: [],
				onFilterChange: vi.fn()
			}
		});

		expect(screen.getByLabelText(/relationship type/i)).toBeInTheDocument();
	});

	it('should handle empty available options arrays', () => {
		render(RelationshipsFilter, {
			props: {
				filterOptions: {},
				availableRelationshipTypes: [],
				availableEntityTypes: [],
				onFilterChange: vi.fn()
			}
		});

		const relationshipSelect = screen.getByLabelText(/relationship type/i);
		const entitySelect = screen.getByLabelText(/entity type/i);

		expect(relationshipSelect).toBeInTheDocument();
		expect(entitySelect).toBeInTheDocument();
	});

	it('should not call onFilterChange multiple times for same value', async () => {
		const onFilterChange = vi.fn();

		render(RelationshipsFilter, {
			props: {
				filterOptions: { strength: 'strong' },
				availableRelationshipTypes: [],
				availableEntityTypes: [],
				onFilterChange
			}
		});

		const select = screen.getByLabelText(/strength/i);
		await fireEvent.change(select, { target: { value: 'strong' } });

		// Should not call onFilterChange if value hasn't actually changed
		expect(onFilterChange).not.toHaveBeenCalled();
	});
});
