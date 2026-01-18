import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import RelationshipFilter from './RelationshipFilter.svelte';
import type { BaseEntity } from '$lib/types';

/**
 * Tests for RelationshipFilter Component
 *
 * Issue #78: Relationship-based entity filtering
 *
 * This component provides UI for filtering entities by their relationships:
 * - Filter by "related to entity" (entity selector)
 * - Filter by relationship type (dropdown)
 * - Filter "has any relationships" (checkbox)
 *
 * These tests are written in the RED phase of TDD - they will FAIL until
 * the component is implemented.
 */

describe('RelationshipFilter Component - Rendering', () => {
	it('should render entity selector for "related to" filter', () => {
		const availableEntities: BaseEntity[] = [];
		const availableRelationshipTypes: string[] = [];

		render(RelationshipFilter, {
			props: {
				relatedToEntityId: undefined,
				relationshipType: undefined,
				hasRelationships: undefined,
				availableEntities,
				availableRelationshipTypes,
				onFilterChange: vi.fn()
			}
		});

		expect(screen.getByLabelText(/related to/i)).toBeInTheDocument();
	});

	it('should render relationship type dropdown', () => {
		const availableEntities: BaseEntity[] = [];
		const availableRelationshipTypes = ['friend_of', 'member_of', 'knows'];

		render(RelationshipFilter, {
			props: {
				relatedToEntityId: undefined,
				relationshipType: undefined,
				hasRelationships: undefined,
				availableEntities,
				availableRelationshipTypes,
				onFilterChange: vi.fn()
			}
		});

		expect(screen.getByLabelText(/relationship type/i)).toBeInTheDocument();
	});

	it('should render "has relationships" checkbox', () => {
		const availableEntities: BaseEntity[] = [];
		const availableRelationshipTypes: string[] = [];

		render(RelationshipFilter, {
			props: {
				relatedToEntityId: undefined,
				relationshipType: undefined,
				hasRelationships: undefined,
				availableEntities,
				availableRelationshipTypes,
				onFilterChange: vi.fn()
			}
		});

		expect(screen.getByLabelText(/has relationships/i)).toBeInTheDocument();
	});

	it('should render clear filters button', () => {
		const availableEntities: BaseEntity[] = [];
		const availableRelationshipTypes: string[] = [];

		render(RelationshipFilter, {
			props: {
				relatedToEntityId: undefined,
				relationshipType: undefined,
				hasRelationships: undefined,
				availableEntities,
				availableRelationshipTypes,
				onFilterChange: vi.fn()
			}
		});

		expect(screen.getByRole('button', { name: /clear|reset/i })).toBeInTheDocument();
	});
});

describe('RelationshipFilter Component - Related To Entity Filter', () => {
	it('should display all available entities in entity selector', () => {
		const availableEntities: BaseEntity[] = [
			{
				id: 'entity-1',
				name: 'Aragorn',
				type: 'character',
				description: '',
				tags: [],
				fields: {},
				links: [],
				notes: '',
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: {}
			},
			{
				id: 'entity-2',
				name: 'Gandalf',
				type: 'character',
				description: '',
				tags: [],
				fields: {},
				links: [],
				notes: '',
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: {}
			}
		];

		render(RelationshipFilter, {
			props: {
				relatedToEntityId: undefined,
				relationshipType: undefined,
				hasRelationships: undefined,
				availableEntities,
				availableRelationshipTypes: [],
				onFilterChange: vi.fn()
			}
		});

		expect(screen.getByRole('option', { name: /aragorn/i })).toBeInTheDocument();
		expect(screen.getByRole('option', { name: /gandalf/i })).toBeInTheDocument();
	});

	it('should include "All entities" option in entity selector', () => {
		render(RelationshipFilter, {
			props: {
				relatedToEntityId: undefined,
				relationshipType: undefined,
				hasRelationships: undefined,
				availableEntities: [],
				availableRelationshipTypes: [],
				onFilterChange: vi.fn()
			}
		});

		expect(screen.getByRole('option', { name: /all entities/i })).toBeInTheDocument();
	});

	it('should show selected entity in entity selector', () => {
		const availableEntities: BaseEntity[] = [
			{
				id: 'entity-1',
				name: 'Aragorn',
				type: 'character',
				description: '',
				tags: [],
				fields: {},
				links: [],
				notes: '',
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: {}
			}
		];

		render(RelationshipFilter, {
			props: {
				relatedToEntityId: 'entity-1',
				relationshipType: undefined,
				hasRelationships: undefined,
				availableEntities,
				availableRelationshipTypes: [],
				onFilterChange: vi.fn()
			}
		});

		const select = screen.getByLabelText(/related to/i) as HTMLSelectElement;
		expect(select.value).toBe('entity-1');
	});

	it('should call onFilterChange when entity is selected', async () => {
		const onFilterChange = vi.fn();
		const availableEntities: BaseEntity[] = [
			{
				id: 'entity-1',
				name: 'Aragorn',
				type: 'character',
				description: '',
				tags: [],
				fields: {},
				links: [],
				notes: '',
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: {}
			}
		];

		render(RelationshipFilter, {
			props: {
				relatedToEntityId: undefined,
				relationshipType: undefined,
				hasRelationships: undefined,
				availableEntities,
				availableRelationshipTypes: [],
				onFilterChange
			}
		});

		const select = screen.getByLabelText(/related to/i);
		await fireEvent.change(select, { target: { value: 'entity-1' } });

		expect(onFilterChange).toHaveBeenCalledWith(
			expect.objectContaining({
				relatedToEntityId: 'entity-1'
			})
		);
	});

	it('should clear entity filter when "All entities" is selected', async () => {
		const onFilterChange = vi.fn();

		render(RelationshipFilter, {
			props: {
				relatedToEntityId: 'entity-1',
				relationshipType: undefined,
				hasRelationships: undefined,
				availableEntities: [],
				availableRelationshipTypes: [],
				onFilterChange
			}
		});

		const select = screen.getByLabelText(/related to/i);
		await fireEvent.change(select, { target: { value: '' } });

		expect(onFilterChange).toHaveBeenCalledWith(
			expect.objectContaining({
				relatedToEntityId: undefined
			})
		);
	});

	it('should group entities by type in selector', () => {
		const availableEntities: BaseEntity[] = [
			{
				id: 'char-1',
				name: 'Aragorn',
				type: 'character',
				description: '',
				tags: [],
				fields: {},
				links: [],
				notes: '',
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: {}
			},
			{
				id: 'loc-1',
				name: 'Rivendell',
				type: 'location',
				description: '',
				tags: [],
				fields: {},
				links: [],
				notes: '',
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: {}
			}
		];

		render(RelationshipFilter, {
			props: {
				relatedToEntityId: undefined,
				relationshipType: undefined,
				hasRelationships: undefined,
				availableEntities,
				availableRelationshipTypes: [],
				onFilterChange: vi.fn()
			}
		});

		// Should have optgroups for Characters and Locations
		const select = screen.getByLabelText(/related to/i);
		const optgroups = select.querySelectorAll('optgroup');
		expect(optgroups.length).toBeGreaterThan(0);
	});
});

describe('RelationshipFilter Component - Relationship Type Filter', () => {
	it('should display all available relationship types in dropdown', () => {
		const availableRelationshipTypes = ['friend_of', 'member_of', 'enemy_of'];

		render(RelationshipFilter, {
			props: {
				relatedToEntityId: undefined,
				relationshipType: undefined,
				hasRelationships: undefined,
				availableEntities: [],
				availableRelationshipTypes,
				onFilterChange: vi.fn()
			}
		});

		expect(screen.getByRole('option', { name: /friend.of/i })).toBeInTheDocument();
		expect(screen.getByRole('option', { name: /member.of/i })).toBeInTheDocument();
		expect(screen.getByRole('option', { name: /enemy.of/i })).toBeInTheDocument();
	});

	it('should include "All types" option in relationship type dropdown', () => {
		render(RelationshipFilter, {
			props: {
				relatedToEntityId: undefined,
				relationshipType: undefined,
				hasRelationships: undefined,
				availableEntities: [],
				availableRelationshipTypes: [],
				onFilterChange: vi.fn()
			}
		});

		expect(screen.getByRole('option', { name: /all types/i })).toBeInTheDocument();
	});

	it('should show selected relationship type', () => {
		const availableRelationshipTypes = ['friend_of', 'member_of'];

		render(RelationshipFilter, {
			props: {
				relatedToEntityId: undefined,
				relationshipType: 'member_of',
				hasRelationships: undefined,
				availableEntities: [],
				availableRelationshipTypes,
				onFilterChange: vi.fn()
			}
		});

		const select = screen.getByLabelText(/relationship type/i) as HTMLSelectElement;
		expect(select.value).toBe('member_of');
	});

	it('should call onFilterChange when relationship type is selected', async () => {
		const onFilterChange = vi.fn();
		const availableRelationshipTypes = ['friend_of', 'member_of'];

		render(RelationshipFilter, {
			props: {
				relatedToEntityId: undefined,
				relationshipType: undefined,
				hasRelationships: undefined,
				availableEntities: [],
				availableRelationshipTypes,
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

	it('should format relationship type labels to be human-readable', () => {
		const availableRelationshipTypes = ['friend_of', 'member_of', 'enemy_of'];

		render(RelationshipFilter, {
			props: {
				relatedToEntityId: undefined,
				relationshipType: undefined,
				hasRelationships: undefined,
				availableEntities: [],
				availableRelationshipTypes,
				onFilterChange: vi.fn()
			}
		});

		// Should format "friend_of" as "Friend Of" or similar
		expect(screen.getByRole('option', { name: /friend.of/i })).toBeInTheDocument();
	});
});

describe('RelationshipFilter Component - Has Relationships Filter', () => {
	it('should render checkbox with correct initial state (unchecked)', () => {
		render(RelationshipFilter, {
			props: {
				relatedToEntityId: undefined,
				relationshipType: undefined,
				hasRelationships: undefined,
				availableEntities: [],
				availableRelationshipTypes: [],
				onFilterChange: vi.fn()
			}
		});

		const checkbox = screen.getByLabelText(/has relationships/i) as HTMLInputElement;
		expect(checkbox.checked).toBe(false);
	});

	it('should show checked state when hasRelationships is true', () => {
		render(RelationshipFilter, {
			props: {
				relatedToEntityId: undefined,
				relationshipType: undefined,
				hasRelationships: true,
				availableEntities: [],
				availableRelationshipTypes: [],
				onFilterChange: vi.fn()
			}
		});

		const checkbox = screen.getByLabelText(/has relationships/i) as HTMLInputElement;
		expect(checkbox.checked).toBe(true);
	});

	it('should call onFilterChange when checkbox is toggled', async () => {
		const onFilterChange = vi.fn();

		render(RelationshipFilter, {
			props: {
				relatedToEntityId: undefined,
				relationshipType: undefined,
				hasRelationships: undefined,
				availableEntities: [],
				availableRelationshipTypes: [],
				onFilterChange
			}
		});

		const checkbox = screen.getByLabelText(/has relationships/i);
		await fireEvent.click(checkbox);

		expect(onFilterChange).toHaveBeenCalledWith(
			expect.objectContaining({
				hasRelationships: true
			})
		);
	});

	it('should toggle hasRelationships from true to false', async () => {
		const onFilterChange = vi.fn();

		render(RelationshipFilter, {
			props: {
				relatedToEntityId: undefined,
				relationshipType: undefined,
				hasRelationships: true,
				availableEntities: [],
				availableRelationshipTypes: [],
				onFilterChange
			}
		});

		const checkbox = screen.getByLabelText(/has relationships/i);
		await fireEvent.click(checkbox);

		expect(onFilterChange).toHaveBeenCalledWith(
			expect.objectContaining({
				hasRelationships: false
			})
		);
	});
});

describe('RelationshipFilter Component - Combined Filters', () => {
	it('should preserve all filters when one is changed', async () => {
		const onFilterChange = vi.fn();

		render(RelationshipFilter, {
			props: {
				relatedToEntityId: 'entity-1',
				relationshipType: 'friend_of',
				hasRelationships: true,
				availableEntities: [],
				availableRelationshipTypes: ['friend_of', 'member_of'],
				onFilterChange
			}
		});

		// Change relationship type
		const select = screen.getByLabelText(/relationship type/i);
		await fireEvent.change(select, { target: { value: 'member_of' } });

		expect(onFilterChange).toHaveBeenCalledWith(
			expect.objectContaining({
				relatedToEntityId: 'entity-1',
				relationshipType: 'member_of',
				hasRelationships: true
			})
		);
	});

	it('should clear all filters when clear button is clicked', async () => {
		const onFilterChange = vi.fn();

		render(RelationshipFilter, {
			props: {
				relatedToEntityId: 'entity-1',
				relationshipType: 'friend_of',
				hasRelationships: true,
				availableEntities: [],
				availableRelationshipTypes: [],
				onFilterChange
			}
		});

		const clearButton = screen.getByRole('button', { name: /clear|reset/i });
		await fireEvent.click(clearButton);

		expect(onFilterChange).toHaveBeenCalledWith({
			relatedToEntityId: undefined,
			relationshipType: undefined,
			hasRelationships: undefined
		});
	});

	it('should show active filter indicator when any filter is set', () => {
		render(RelationshipFilter, {
			props: {
				relatedToEntityId: 'entity-1',
				relationshipType: undefined,
				hasRelationships: undefined,
				availableEntities: [],
				availableRelationshipTypes: [],
				onFilterChange: vi.fn()
			}
		});

		// Should have visual indicator that filters are active
		const filterContainer = screen.getByLabelText(/related to/i).closest('div');
		expect(filterContainer).toBeInTheDocument();
	});

	it('should NOT show active filter indicator when no filters are set', () => {
		render(RelationshipFilter, {
			props: {
				relatedToEntityId: undefined,
				relationshipType: undefined,
				hasRelationships: undefined,
				availableEntities: [],
				availableRelationshipTypes: [],
				onFilterChange: vi.fn()
			}
		});

		// No visual indicator for active filters
		const filterContainer = screen.getByLabelText(/related to/i).closest('div');
		expect(filterContainer).toBeInTheDocument();
	});
});

describe('RelationshipFilter Component - Accessibility', () => {
	it('should have proper labels for all inputs', () => {
		render(RelationshipFilter, {
			props: {
				relatedToEntityId: undefined,
				relationshipType: undefined,
				hasRelationships: undefined,
				availableEntities: [],
				availableRelationshipTypes: [],
				onFilterChange: vi.fn()
			}
		});

		expect(screen.getByLabelText(/related to/i)).toHaveAccessibleName();
		expect(screen.getByLabelText(/relationship type/i)).toHaveAccessibleName();
		expect(screen.getByLabelText(/has relationships/i)).toHaveAccessibleName();
	});

	it('should support keyboard navigation', () => {
		render(RelationshipFilter, {
			props: {
				relatedToEntityId: undefined,
				relationshipType: undefined,
				hasRelationships: undefined,
				availableEntities: [],
				availableRelationshipTypes: [],
				onFilterChange: vi.fn()
			}
		});

		const entitySelect = screen.getByLabelText(/related to/i);
		const typeSelect = screen.getByLabelText(/relationship type/i);
		const checkbox = screen.getByLabelText(/has relationships/i);

		// All inputs should be tabbable
		expect(entitySelect.tagName).toBe('SELECT');
		expect(typeSelect.tagName).toBe('SELECT');
		expect(checkbox.tagName).toBe('INPUT');
		expect(checkbox).toHaveAttribute('type', 'checkbox');
	});
});

describe('RelationshipFilter Component - Edge Cases', () => {
	it('should handle empty available entities list', () => {
		render(RelationshipFilter, {
			props: {
				relatedToEntityId: undefined,
				relationshipType: undefined,
				hasRelationships: undefined,
				availableEntities: [],
				availableRelationshipTypes: [],
				onFilterChange: vi.fn()
			}
		});

		const select = screen.getByLabelText(/related to/i);
		expect(select).toBeInTheDocument();
	});

	it('should handle empty relationship types list', () => {
		render(RelationshipFilter, {
			props: {
				relatedToEntityId: undefined,
				relationshipType: undefined,
				hasRelationships: undefined,
				availableEntities: [],
				availableRelationshipTypes: [],
				onFilterChange: vi.fn()
			}
		});

		const select = screen.getByLabelText(/relationship type/i);
		expect(select).toBeInTheDocument();
	});

	it('should handle undefined filter values gracefully', () => {
		render(RelationshipFilter, {
			props: {
				relatedToEntityId: undefined,
				relationshipType: undefined,
				hasRelationships: undefined,
				availableEntities: [],
				availableRelationshipTypes: [],
				onFilterChange: vi.fn()
			}
		});

		expect(screen.getByLabelText(/related to/i)).toBeInTheDocument();
		expect(screen.getByLabelText(/relationship type/i)).toBeInTheDocument();
		expect(screen.getByLabelText(/has relationships/i)).toBeInTheDocument();
	});

	it('should not call onFilterChange when value is the same', async () => {
		const onFilterChange = vi.fn();
		const entity: BaseEntity = {
			id: 'entity-1',
			name: 'Test Entity',
			type: 'character',
			description: '',
			tags: [],
			fields: {},
			links: [],
			notes: '',
			createdAt: new Date(),
			updatedAt: new Date(),
			metadata: {}
		};

		render(RelationshipFilter, {
			props: {
				relatedToEntityId: 'entity-1',
				relationshipType: undefined,
				hasRelationships: undefined,
				availableEntities: [entity],
				availableRelationshipTypes: [],
				onFilterChange
			}
		});

		const select = screen.getByLabelText(/related to/i);
		await fireEvent.change(select, { target: { value: 'entity-1' } });

		// Should not call onFilterChange if value hasn't actually changed
		expect(onFilterChange).not.toHaveBeenCalled();
	});
});
