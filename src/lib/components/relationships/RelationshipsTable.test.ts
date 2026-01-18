import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import RelationshipsTable from './RelationshipsTable.svelte';
import { createMockEntity } from '../../../tests/utils/testUtils';
import type { BaseEntity, EntityLink } from '$lib/types';
import type { RelationshipSortOptions } from '$lib/types/relationships';

/**
 * Tests for RelationshipsTable Component
 *
 * Issue #76 Phase 1: Dedicated Relationships Management Page
 *
 * This component renders the main relationships table with sortable columns,
 * bulk selection, and individual row actions.
 *
 * These tests are written in the RED phase of TDD - they will FAIL until
 * the component is implemented.
 */

describe('RelationshipsTable Component - Basic Rendering', () => {
	it('should render table element', () => {
		render(RelationshipsTable, {
			props: {
				relationships: [],
				selectedIds: new Set(),
				sortOptions: { field: 'targetName', direction: 'asc' },
				onSelect: vi.fn(),
				onSelectAll: vi.fn(),
				onSort: vi.fn(),
				onRemove: vi.fn()
			}
		});

		const table = screen.getByRole('table');
		expect(table).toBeInTheDocument();
	});

	it('should render table headers', () => {
		render(RelationshipsTable, {
			props: {
				relationships: [],
				selectedIds: new Set(),
				sortOptions: { field: 'targetName', direction: 'asc' },
				onSelect: vi.fn(),
				onSelectAll: vi.fn(),
				onSort: vi.fn(),
				onRemove: vi.fn()
			}
		});

		expect(screen.getByRole('columnheader', { name: /target/i })).toBeInTheDocument();
		expect(screen.getByRole('columnheader', { name: /type/i })).toBeInTheDocument();
		expect(screen.getByRole('columnheader', { name: /relationship/i })).toBeInTheDocument();
		expect(screen.getByRole('columnheader', { name: /strength/i })).toBeInTheDocument();
		expect(screen.getByRole('columnheader', { name: /actions/i })).toBeInTheDocument();
	});

	it('should render select all checkbox in header', () => {
		render(RelationshipsTable, {
			props: {
				relationships: [],
				selectedIds: new Set(),
				sortOptions: { field: 'targetName', direction: 'asc' },
				onSelect: vi.fn(),
				onSelectAll: vi.fn(),
				onSort: vi.fn(),
				onRemove: vi.fn()
			}
		});

		const checkboxes = screen.getAllByRole('checkbox');
		expect(checkboxes.length).toBeGreaterThan(0);
	});

	it('should render empty state when no relationships', () => {
		render(RelationshipsTable, {
			props: {
				relationships: [],
				selectedIds: new Set(),
				sortOptions: { field: 'targetName', direction: 'asc' },
				onSelect: vi.fn(),
				onSelectAll: vi.fn(),
				onSort: vi.fn(),
				onRemove: vi.fn()
			}
		});

		expect(screen.getByText(/no relationships/i)).toBeInTheDocument();
	});
});

describe('RelationshipsTable Component - Rendering Rows', () => {
	let relationships: Array<{ entity: BaseEntity; link: EntityLink; isReverse: boolean }>;

	beforeEach(() => {
		relationships = [
			{
				entity: createMockEntity({ id: 'entity-1', name: 'Gandalf', type: 'npc' }),
				link: {
					id: 'link-1',
					targetId: 'entity-1',
					targetType: 'npc',
					relationship: 'friend_of',
					bidirectional: true,
					strength: 'strong'
				},
				isReverse: false
			},
			{
				entity: createMockEntity({ id: 'entity-2', name: 'Rivendell', type: 'location' }),
				link: {
					id: 'link-2',
					targetId: 'entity-2',
					targetType: 'location',
					relationship: 'visited',
					bidirectional: false
				},
				isReverse: false
			}
		];
	});

	it('should render correct number of rows', () => {
		const { container } = render(RelationshipsTable, {
			props: {
				relationships,
				selectedIds: new Set(),
				sortOptions: { field: 'targetName', direction: 'asc' },
				onSelect: vi.fn(),
				onSelectAll: vi.fn(),
				onSort: vi.fn(),
				onRemove: vi.fn()
			}
		});

		const rows = container.querySelectorAll('tbody tr');
		expect(rows.length).toBe(2);
	});

	it('should render entity names in rows', () => {
		render(RelationshipsTable, {
			props: {
				relationships,
				selectedIds: new Set(),
				sortOptions: { field: 'targetName', direction: 'asc' },
				onSelect: vi.fn(),
				onSelectAll: vi.fn(),
				onSort: vi.fn(),
				onRemove: vi.fn()
			}
		});

		expect(screen.getByText('Gandalf')).toBeInTheDocument();
		expect(screen.getByText('Rivendell')).toBeInTheDocument();
	});

	it('should render entity types in rows', () => {
		render(RelationshipsTable, {
			props: {
				relationships,
				selectedIds: new Set(),
				sortOptions: { field: 'targetName', direction: 'asc' },
				onSelect: vi.fn(),
				onSelectAll: vi.fn(),
				onSort: vi.fn(),
				onRemove: vi.fn()
			}
		});

		expect(screen.getByText(/npc/i)).toBeInTheDocument();
		expect(screen.getByText(/location/i)).toBeInTheDocument();
	});

	it('should render relationship types in rows', () => {
		render(RelationshipsTable, {
			props: {
				relationships,
				selectedIds: new Set(),
				sortOptions: { field: 'targetName', direction: 'asc' },
				onSelect: vi.fn(),
				onSelectAll: vi.fn(),
				onSort: vi.fn(),
				onRemove: vi.fn()
			}
		});

		expect(screen.getByText(/friend_of/i)).toBeInTheDocument();
		expect(screen.getByText(/visited/i)).toBeInTheDocument();
	});

	it('should render strength badges in rows', () => {
		render(RelationshipsTable, {
			props: {
				relationships,
				selectedIds: new Set(),
				sortOptions: { field: 'targetName', direction: 'asc' },
				onSelect: vi.fn(),
				onSelectAll: vi.fn(),
				onSort: vi.fn(),
				onRemove: vi.fn()
			}
		});

		expect(screen.getByText(/strong/i)).toBeInTheDocument();
	});
});

describe('RelationshipsTable Component - Select All Checkbox', () => {
	let relationships: Array<{ entity: BaseEntity; link: EntityLink; isReverse: boolean }>;

	beforeEach(() => {
		relationships = [
			{
				entity: createMockEntity({ id: 'entity-1', name: 'Entity 1', type: 'character' }),
				link: {
					id: 'link-1',
					targetId: 'entity-1',
					targetType: 'character',
					relationship: 'knows',
					bidirectional: true
				},
				isReverse: false
			},
			{
				entity: createMockEntity({ id: 'entity-2', name: 'Entity 2', type: 'character' }),
				link: {
					id: 'link-2',
					targetId: 'entity-2',
					targetType: 'character',
					relationship: 'knows',
					bidirectional: true
				},
				isReverse: false
			}
		];
	});

	it('should be unchecked when no items selected', () => {
		render(RelationshipsTable, {
			props: {
				relationships,
				selectedIds: new Set(),
				sortOptions: { field: 'targetName', direction: 'asc' },
				onSelect: vi.fn(),
				onSelectAll: vi.fn(),
				onSort: vi.fn(),
				onRemove: vi.fn()
			}
		});

		const selectAllCheckbox = screen.getAllByRole('checkbox')[0] as HTMLInputElement;
		expect(selectAllCheckbox.checked).toBe(false);
	});

	it('should be checked when all items selected', () => {
		render(RelationshipsTable, {
			props: {
				relationships,
				selectedIds: new Set(['link-1', 'link-2']),
				sortOptions: { field: 'targetName', direction: 'asc' },
				onSelect: vi.fn(),
				onSelectAll: vi.fn(),
				onSort: vi.fn(),
				onRemove: vi.fn()
			}
		});

		const selectAllCheckbox = screen.getAllByRole('checkbox')[0] as HTMLInputElement;
		expect(selectAllCheckbox.checked).toBe(true);
	});

	it('should be indeterminate when some items selected', () => {
		render(RelationshipsTable, {
			props: {
				relationships,
				selectedIds: new Set(['link-1']),
				sortOptions: { field: 'targetName', direction: 'asc' },
				onSelect: vi.fn(),
				onSelectAll: vi.fn(),
				onSort: vi.fn(),
				onRemove: vi.fn()
			}
		});

		const selectAllCheckbox = screen.getAllByRole('checkbox')[0] as HTMLInputElement;
		expect(selectAllCheckbox.indeterminate).toBe(true);
	});

	it('should call onSelectAll with true when clicked from unchecked', async () => {
		const onSelectAll = vi.fn();

		render(RelationshipsTable, {
			props: {
				relationships,
				selectedIds: new Set(),
				sortOptions: { field: 'targetName', direction: 'asc' },
				onSelect: vi.fn(),
				onSelectAll,
				onSort: vi.fn(),
				onRemove: vi.fn()
			}
		});

		const selectAllCheckbox = screen.getAllByRole('checkbox')[0];
		await fireEvent.click(selectAllCheckbox);

		expect(onSelectAll).toHaveBeenCalledWith(true);
	});

	it('should call onSelectAll with false when clicked from checked', async () => {
		const onSelectAll = vi.fn();

		render(RelationshipsTable, {
			props: {
				relationships,
				selectedIds: new Set(['link-1', 'link-2']),
				sortOptions: { field: 'targetName', direction: 'asc' },
				onSelect: vi.fn(),
				onSelectAll,
				onSort: vi.fn(),
				onRemove: vi.fn()
			}
		});

		const selectAllCheckbox = screen.getAllByRole('checkbox')[0];
		await fireEvent.click(selectAllCheckbox);

		expect(onSelectAll).toHaveBeenCalledWith(false);
	});
});

describe('RelationshipsTable Component - Individual Row Selection', () => {
	let relationships: Array<{ entity: BaseEntity; link: EntityLink; isReverse: boolean }>;

	beforeEach(() => {
		relationships = [
			{
				entity: createMockEntity({ id: 'entity-1', name: 'Test 1', type: 'character' }),
				link: {
					id: 'link-1',
					targetId: 'entity-1',
					targetType: 'character',
					relationship: 'knows',
					bidirectional: true
				},
				isReverse: false
			}
		];
	});

	it('should show row checkbox as checked when selected', () => {
		render(RelationshipsTable, {
			props: {
				relationships,
				selectedIds: new Set(['link-1']),
				sortOptions: { field: 'targetName', direction: 'asc' },
				onSelect: vi.fn(),
				onSelectAll: vi.fn(),
				onSort: vi.fn(),
				onRemove: vi.fn()
			}
		});

		const checkboxes = screen.getAllByRole('checkbox');
		const rowCheckbox = checkboxes[1] as HTMLInputElement; // First is select-all
		expect(rowCheckbox.checked).toBe(true);
	});

	it('should call onSelect with link id and true when row checkbox clicked', async () => {
		const onSelect = vi.fn();

		render(RelationshipsTable, {
			props: {
				relationships,
				selectedIds: new Set(),
				sortOptions: { field: 'targetName', direction: 'asc' },
				onSelect,
				onSelectAll: vi.fn(),
				onSort: vi.fn(),
				onRemove: vi.fn()
			}
		});

		const checkboxes = screen.getAllByRole('checkbox');
		const rowCheckbox = checkboxes[1];
		await fireEvent.click(rowCheckbox);

		expect(onSelect).toHaveBeenCalledWith('link-1', true);
	});

	it('should call onSelect with link id and false when unchecking', async () => {
		const onSelect = vi.fn();

		render(RelationshipsTable, {
			props: {
				relationships,
				selectedIds: new Set(['link-1']),
				sortOptions: { field: 'targetName', direction: 'asc' },
				onSelect,
				onSelectAll: vi.fn(),
				onSort: vi.fn(),
				onRemove: vi.fn()
			}
		});

		const checkboxes = screen.getAllByRole('checkbox');
		const rowCheckbox = checkboxes[1];
		await fireEvent.click(rowCheckbox);

		expect(onSelect).toHaveBeenCalledWith('link-1', false);
	});
});

describe('RelationshipsTable Component - Sorting', () => {
	let relationships: Array<{ entity: BaseEntity; link: EntityLink; isReverse: boolean }>;

	beforeEach(() => {
		relationships = [
			{
				entity: createMockEntity({ id: 'entity-1', name: 'Aragorn', type: 'character' }),
				link: {
					id: 'link-1',
					targetId: 'entity-1',
					targetType: 'character',
					relationship: 'friend_of',
					bidirectional: true,
					strength: 'strong'
				},
				isReverse: false
			}
		];
	});

	it('should show sort indicator on sorted column', () => {
		render(RelationshipsTable, {
			props: {
				relationships,
				selectedIds: new Set(),
				sortOptions: { field: 'targetName', direction: 'asc' },
				onSelect: vi.fn(),
				onSelectAll: vi.fn(),
				onSort: vi.fn(),
				onRemove: vi.fn()
			}
		});

		const targetHeader = screen.getByRole('columnheader', { name: /target/i });
		// Should have some sort indicator (arrow, icon, etc.)
		expect(targetHeader.textContent).toMatch(/▲|▼|↑|↓|asc|desc/i);
	});

	it('should call onSort when clicking target name header', async () => {
		const onSort = vi.fn();

		render(RelationshipsTable, {
			props: {
				relationships,
				selectedIds: new Set(),
				sortOptions: { field: 'relationship', direction: 'asc' },
				onSelect: vi.fn(),
				onSelectAll: vi.fn(),
				onSort,
				onRemove: vi.fn()
			}
		});

		const targetHeader = screen.getByRole('columnheader', { name: /target/i });
		await fireEvent.click(targetHeader);

		expect(onSort).toHaveBeenCalledWith(
			expect.objectContaining({
				field: 'targetName'
			})
		);
	});

	it('should call onSort when clicking relationship header', async () => {
		const onSort = vi.fn();

		render(RelationshipsTable, {
			props: {
				relationships,
				selectedIds: new Set(),
				sortOptions: { field: 'targetName', direction: 'asc' },
				onSelect: vi.fn(),
				onSelectAll: vi.fn(),
				onSort,
				onRemove: vi.fn()
			}
		});

		const relationshipHeader = screen.getByRole('columnheader', { name: /relationship/i });
		await fireEvent.click(relationshipHeader);

		expect(onSort).toHaveBeenCalledWith(
			expect.objectContaining({
				field: 'relationship'
			})
		);
	});

	it('should call onSort when clicking strength header', async () => {
		const onSort = vi.fn();

		render(RelationshipsTable, {
			props: {
				relationships,
				selectedIds: new Set(),
				sortOptions: { field: 'targetName', direction: 'asc' },
				onSelect: vi.fn(),
				onSelectAll: vi.fn(),
				onSort,
				onRemove: vi.fn()
			}
		});

		const strengthHeader = screen.getByRole('columnheader', { name: /strength/i });
		await fireEvent.click(strengthHeader);

		expect(onSort).toHaveBeenCalledWith(
			expect.objectContaining({
				field: 'strength'
			})
		);
	});

	it('should toggle sort direction when clicking same header', async () => {
		const onSort = vi.fn();

		render(RelationshipsTable, {
			props: {
				relationships,
				selectedIds: new Set(),
				sortOptions: { field: 'targetName', direction: 'asc' },
				onSelect: vi.fn(),
				onSelectAll: vi.fn(),
				onSort,
				onRemove: vi.fn()
			}
		});

		const targetHeader = screen.getByRole('columnheader', { name: /target/i });
		await fireEvent.click(targetHeader);

		expect(onSort).toHaveBeenCalledWith(
			expect.objectContaining({
				field: 'targetName',
				direction: 'desc'
			})
		);
	});

	it('should show ascending indicator correctly', () => {
		const { container } = render(RelationshipsTable, {
			props: {
				relationships,
				selectedIds: new Set(),
				sortOptions: { field: 'targetName', direction: 'asc' },
				onSelect: vi.fn(),
				onSelectAll: vi.fn(),
				onSort: vi.fn(),
				onRemove: vi.fn()
			}
		});

		const targetHeader = screen.getByRole('columnheader', { name: /target/i });
		expect(targetHeader.textContent).toMatch(/▲|↑|asc/i);
	});

	it('should show descending indicator correctly', () => {
		render(RelationshipsTable, {
			props: {
				relationships,
				selectedIds: new Set(),
				sortOptions: { field: 'targetName', direction: 'desc' },
				onSelect: vi.fn(),
				onSelectAll: vi.fn(),
				onSort: vi.fn(),
				onRemove: vi.fn()
			}
		});

		const targetHeader = screen.getByRole('columnheader', { name: /target/i });
		expect(targetHeader.textContent).toMatch(/▼|↓|desc/i);
	});
});

describe('RelationshipsTable Component - Remove Action', () => {
	let relationships: Array<{ entity: BaseEntity; link: EntityLink; isReverse: boolean }>;

	beforeEach(() => {
		relationships = [
			{
				entity: createMockEntity({ id: 'entity-1', name: 'Test', type: 'character' }),
				link: {
					id: 'link-1',
					targetId: 'entity-1',
					targetType: 'character',
					relationship: 'knows',
					bidirectional: true
				},
				isReverse: false
			}
		];
	});

	it('should call onRemove with link id when remove button clicked', async () => {
		const onRemove = vi.fn();

		render(RelationshipsTable, {
			props: {
				relationships,
				selectedIds: new Set(),
				sortOptions: { field: 'targetName', direction: 'asc' },
				onSelect: vi.fn(),
				onSelectAll: vi.fn(),
				onSort: vi.fn(),
				onRemove
			}
		});

		const removeButton = screen.getByRole('button', { name: /remove|delete/i });
		await fireEvent.click(removeButton);

		expect(onRemove).toHaveBeenCalledWith('link-1');
	});

	it('should not show remove button for reverse relationships', () => {
		const reverseRelationships = [
			{
				entity: createMockEntity({ id: 'entity-1', name: 'Test', type: 'character' }),
				link: {
					id: 'link-1',
					targetId: 'entity-1',
					targetType: 'character',
					relationship: 'knows',
					bidirectional: true
				},
				isReverse: true
			}
		];

		render(RelationshipsTable, {
			props: {
				relationships: reverseRelationships,
				selectedIds: new Set(),
				sortOptions: { field: 'targetName', direction: 'asc' },
				onSelect: vi.fn(),
				onSelectAll: vi.fn(),
				onSort: vi.fn(),
				onRemove: vi.fn()
			}
		});

		const removeButton = screen.queryByRole('button', { name: /remove|delete/i });
		expect(removeButton).not.toBeInTheDocument();
	});
});

describe('RelationshipsTable Component - Accessibility', () => {
	let relationships: Array<{ entity: BaseEntity; link: EntityLink; isReverse: boolean }>;

	beforeEach(() => {
		relationships = [
			{
				entity: createMockEntity({ id: 'entity-1', name: 'Test', type: 'character' }),
				link: {
					id: 'link-1',
					targetId: 'entity-1',
					targetType: 'character',
					relationship: 'knows',
					bidirectional: true
				},
				isReverse: false
			}
		];
	});

	it('should have semantic table structure', () => {
		const { container } = render(RelationshipsTable, {
			props: {
				relationships,
				selectedIds: new Set(),
				sortOptions: { field: 'targetName', direction: 'asc' },
				onSelect: vi.fn(),
				onSelectAll: vi.fn(),
				onSort: vi.fn(),
				onRemove: vi.fn()
			}
		});

		expect(container.querySelector('thead')).toBeInTheDocument();
		expect(container.querySelector('tbody')).toBeInTheDocument();
	});

	it('should have accessible column headers', () => {
		render(RelationshipsTable, {
			props: {
				relationships,
				selectedIds: new Set(),
				sortOptions: { field: 'targetName', direction: 'asc' },
				onSelect: vi.fn(),
				onSelectAll: vi.fn(),
				onSort: vi.fn(),
				onRemove: vi.fn()
			}
		});

		const headers = screen.getAllByRole('columnheader');
		expect(headers.length).toBeGreaterThan(0);
		headers.forEach((header) => {
			expect(header).toHaveAccessibleName();
		});
	});

	it('should support keyboard navigation for sortable headers', () => {
		render(RelationshipsTable, {
			props: {
				relationships,
				selectedIds: new Set(),
				sortOptions: { field: 'targetName', direction: 'asc' },
				onSelect: vi.fn(),
				onSelectAll: vi.fn(),
				onSort: vi.fn(),
				onRemove: vi.fn()
			}
		});

		const targetHeader = screen.getByRole('columnheader', { name: /target/i });
		// Sortable headers should be clickable
		expect(targetHeader).toBeInTheDocument();
	});
});

describe('RelationshipsTable Component - Edge Cases', () => {
	it('should handle empty relationships array', () => {
		render(RelationshipsTable, {
			props: {
				relationships: [],
				selectedIds: new Set(),
				sortOptions: { field: 'targetName', direction: 'asc' },
				onSelect: vi.fn(),
				onSelectAll: vi.fn(),
				onSort: vi.fn(),
				onRemove: vi.fn()
			}
		});

		expect(screen.getByText(/no relationships/i)).toBeInTheDocument();
	});

	it('should handle large number of relationships', () => {
		const manyRelationships = Array.from({ length: 100 }, (_, i) => ({
			entity: createMockEntity({ id: `entity-${i}`, name: `Entity ${i}`, type: 'character' }),
			link: {
				id: `link-${i}`,
				targetId: `entity-${i}`,
				targetType: 'character' as const,
				relationship: 'knows',
				bidirectional: true
			},
			isReverse: false
		}));

		const { container } = render(RelationshipsTable, {
			props: {
				relationships: manyRelationships,
				selectedIds: new Set(),
				sortOptions: { field: 'targetName', direction: 'asc' },
				onSelect: vi.fn(),
				onSelectAll: vi.fn(),
				onSort: vi.fn(),
				onRemove: vi.fn()
			}
		});

		const rows = container.querySelectorAll('tbody tr');
		expect(rows.length).toBe(100);
	});

	it('should handle relationships without strength', () => {
		const relationships = [
			{
				entity: createMockEntity({ id: 'entity-1', name: 'Test', type: 'character' }),
				link: {
					id: 'link-1',
					targetId: 'entity-1',
					targetType: 'character' as const,
					relationship: 'knows',
					bidirectional: true
					// No strength field
				},
				isReverse: false
			}
		];

		render(RelationshipsTable, {
			props: {
				relationships,
				selectedIds: new Set(),
				sortOptions: { field: 'targetName', direction: 'asc' },
				onSelect: vi.fn(),
				onSelectAll: vi.fn(),
				onSort: vi.fn(),
				onRemove: vi.fn()
			}
		});

		expect(screen.getByText('Test')).toBeInTheDocument();
	});
});
