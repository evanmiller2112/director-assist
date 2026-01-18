import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import RelationshipRow from './RelationshipRow.svelte';
import { createMockEntity } from '../../../tests/utils/testUtils';
import type { BaseEntity, EntityLink } from '$lib/types';

/**
 * Tests for RelationshipRow Component
 *
 * Issue #76 Phase 1: Dedicated Relationships Management Page
 *
 * This component renders a single row in the relationships table,
 * displaying the linked entity, relationship details, and action buttons.
 *
 * These tests are written in the RED phase of TDD - they will FAIL until
 * the component is implemented.
 */

describe('RelationshipRow Component - Basic Rendering', () => {
	let linkedEntity: BaseEntity;
	let link: EntityLink;

	beforeEach(() => {
		linkedEntity = createMockEntity({
			id: 'linked-1',
			name: 'Gandalf',
			type: 'npc'
		});

		link = {
			id: 'link-1',
			sourceId: 'source-1',
			targetId: 'linked-1',
			targetType: 'npc',
			relationship: 'friend_of',
			bidirectional: true
		};
	});

	it('should render checkbox for selection', () => {
		render(RelationshipRow, {
			props: {
				linkedEntity,
				link,
				isReverse: false,
				selected: false,
				onSelect: vi.fn(),
				onRemove: vi.fn()
			}
		});

		const checkbox = screen.getByRole('checkbox');
		expect(checkbox).toBeInTheDocument();
	});

	it('should render entity name', () => {
		render(RelationshipRow, {
			props: {
				linkedEntity,
				link,
				isReverse: false,
				selected: false,
				onSelect: vi.fn(),
				onRemove: vi.fn()
			}
		});

		expect(screen.getByText('Gandalf')).toBeInTheDocument();
	});

	it('should render entity type', () => {
		render(RelationshipRow, {
			props: {
				linkedEntity,
				link,
				isReverse: false,
				selected: false,
				onSelect: vi.fn(),
				onRemove: vi.fn()
			}
		});

		expect(screen.getByText(/npc/i)).toBeInTheDocument();
	});

	it('should render relationship type', () => {
		render(RelationshipRow, {
			props: {
				linkedEntity,
				link,
				isReverse: false,
				selected: false,
				onSelect: vi.fn(),
				onRemove: vi.fn()
			}
		});

		expect(screen.getByText(/friend_of/i)).toBeInTheDocument();
	});

	it('should render remove button', () => {
		render(RelationshipRow, {
			props: {
				linkedEntity,
				link,
				isReverse: false,
				selected: false,
				onSelect: vi.fn(),
				onRemove: vi.fn()
			}
		});

		const removeButton = screen.getByRole('button', { name: /remove|delete/i });
		expect(removeButton).toBeInTheDocument();
	});
});

describe('RelationshipRow Component - Checkbox Selection', () => {
	let linkedEntity: BaseEntity;
	let link: EntityLink;

	beforeEach(() => {
		linkedEntity = createMockEntity({ id: 'linked-1', name: 'Test Entity', type: 'character' });
		link = {
			id: 'link-1',
			targetId: 'linked-1',
			targetType: 'character',
			relationship: 'knows',
			bidirectional: true
		};
	});

	it('should reflect selected state in checkbox', () => {
		render(RelationshipRow, {
			props: {
				linkedEntity,
				link,
				isReverse: false,
				selected: true,
				onSelect: vi.fn(),
				onRemove: vi.fn()
			}
		});

		const checkbox = screen.getByRole('checkbox') as HTMLInputElement;
		expect(checkbox.checked).toBe(true);
	});

	it('should show unchecked when not selected', () => {
		render(RelationshipRow, {
			props: {
				linkedEntity,
				link,
				isReverse: false,
				selected: false,
				onSelect: vi.fn(),
				onRemove: vi.fn()
			}
		});

		const checkbox = screen.getByRole('checkbox') as HTMLInputElement;
		expect(checkbox.checked).toBe(false);
	});

	it('should call onSelect with true when checkbox is checked', async () => {
		const onSelect = vi.fn();

		render(RelationshipRow, {
			props: {
				linkedEntity,
				link,
				isReverse: false,
				selected: false,
				onSelect,
				onRemove: vi.fn()
			}
		});

		const checkbox = screen.getByRole('checkbox');
		await fireEvent.click(checkbox);

		expect(onSelect).toHaveBeenCalledWith(true);
	});

	it('should call onSelect with false when checkbox is unchecked', async () => {
		const onSelect = vi.fn();

		render(RelationshipRow, {
			props: {
				linkedEntity,
				link,
				isReverse: false,
				selected: true,
				onSelect,
				onRemove: vi.fn()
			}
		});

		const checkbox = screen.getByRole('checkbox');
		await fireEvent.click(checkbox);

		expect(onSelect).toHaveBeenCalledWith(false);
	});

	it('should apply selected row styling when checked', () => {
		const { container } = render(RelationshipRow, {
			props: {
				linkedEntity,
				link,
				isReverse: false,
				selected: true,
				onSelect: vi.fn(),
				onRemove: vi.fn()
			}
		});

		const row = container.querySelector('tr');
		expect(row).toHaveClass(/selected|highlighted|bg-/);
	});
});

describe('RelationshipRow Component - Strength Badge', () => {
	let linkedEntity: BaseEntity;

	beforeEach(() => {
		linkedEntity = createMockEntity({ id: 'linked-1', name: 'Test', type: 'character' });
	});

	it('should display strong strength badge', () => {
		const link: EntityLink = {
			id: 'link-1',
			targetId: 'linked-1',
			targetType: 'character',
			relationship: 'ally_of',
			bidirectional: true,
			strength: 'strong'
		};

		render(RelationshipRow, {
			props: {
				linkedEntity,
				link,
				isReverse: false,
				selected: false,
				onSelect: vi.fn(),
				onRemove: vi.fn()
			}
		});

		expect(screen.getByText(/strong/i)).toBeInTheDocument();
	});

	it('should display moderate strength badge', () => {
		const link: EntityLink = {
			id: 'link-1',
			targetId: 'linked-1',
			targetType: 'character',
			relationship: 'knows',
			bidirectional: true,
			strength: 'moderate'
		};

		render(RelationshipRow, {
			props: {
				linkedEntity,
				link,
				isReverse: false,
				selected: false,
				onSelect: vi.fn(),
				onRemove: vi.fn()
			}
		});

		expect(screen.getByText(/moderate/i)).toBeInTheDocument();
	});

	it('should display weak strength badge', () => {
		const link: EntityLink = {
			id: 'link-1',
			targetId: 'linked-1',
			targetType: 'character',
			relationship: 'acquaintance',
			bidirectional: true,
			strength: 'weak'
		};

		render(RelationshipRow, {
			props: {
				linkedEntity,
				link,
				isReverse: false,
				selected: false,
				onSelect: vi.fn(),
				onRemove: vi.fn()
			}
		});

		expect(screen.getByText(/weak/i)).toBeInTheDocument();
	});

	it('should show dash or empty for undefined strength', () => {
		const link: EntityLink = {
			id: 'link-1',
			targetId: 'linked-1',
			targetType: 'character',
			relationship: 'knows',
			bidirectional: true
		};

		render(RelationshipRow, {
			props: {
				linkedEntity,
				link,
				isReverse: false,
				selected: false,
				onSelect: vi.fn(),
				onRemove: vi.fn()
			}
		});

		// Should show some placeholder when strength is not set
		expect(screen.queryByText(/strong/i)).not.toBeInTheDocument();
		expect(screen.queryByText(/moderate/i)).not.toBeInTheDocument();
		expect(screen.queryByText(/weak/i)).not.toBeInTheDocument();
	});
});

describe('RelationshipRow Component - Direction Indicator', () => {
	let linkedEntity: BaseEntity;
	let link: EntityLink;

	beforeEach(() => {
		linkedEntity = createMockEntity({ id: 'linked-1', name: 'Target', type: 'character' });
		link = {
			id: 'link-1',
			targetId: 'linked-1',
			targetType: 'character',
			relationship: 'knows',
			bidirectional: true
		};
	});

	it('should show bidirectional indicator for bidirectional links', () => {
		const { container } = render(RelationshipRow, {
			props: {
				linkedEntity,
				link: { ...link, bidirectional: true },
				isReverse: false,
				selected: false,
				onSelect: vi.fn(),
				onRemove: vi.fn()
			}
		});

		// Should have some visual indicator for bidirectional (e.g., ↔)
		const bidirectionalIcon = container.querySelector('[class*="bidirectional"], [class*="arrow"]');
		expect(bidirectionalIcon).toBeInTheDocument();
	});

	it('should show directional indicator for unidirectional links', () => {
		const { container } = render(RelationshipRow, {
			props: {
				linkedEntity,
				link: { ...link, bidirectional: false },
				isReverse: false,
				selected: false,
				onSelect: vi.fn(),
				onRemove: vi.fn()
			}
		});

		// Should have directional arrow (e.g., →)
		const directionalIcon = container.querySelector('[class*="arrow"], [class*="direction"]');
		expect(directionalIcon).toBeInTheDocument();
	});

	it('should show reverse indicator when isReverse is true', () => {
		const { container } = render(RelationshipRow, {
			props: {
				linkedEntity,
				link,
				isReverse: true,
				selected: false,
				onSelect: vi.fn(),
				onRemove: vi.fn()
			}
		});

		// Should indicate this is a reverse/incoming link
		const reverseIndicator = container.querySelector('[class*="reverse"], [class*="incoming"]');
		expect(reverseIndicator).toBeInTheDocument();
	});

	it('should show asymmetric relationship correctly', () => {
		const asymmetricLink: EntityLink = {
			id: 'link-1',
			targetId: 'linked-1',
			targetType: 'character',
			relationship: 'patron_of',
			bidirectional: true,
			reverseRelationship: 'client_of'
		};

		render(RelationshipRow, {
			props: {
				linkedEntity,
				link: asymmetricLink,
				isReverse: false,
				selected: false,
				onSelect: vi.fn(),
				onRemove: vi.fn()
			}
		});

		expect(screen.getByText(/patron_of/i)).toBeInTheDocument();
		expect(screen.getByText(/client_of/i)).toBeInTheDocument();
	});
});

describe('RelationshipRow Component - Remove Button', () => {
	let linkedEntity: BaseEntity;
	let link: EntityLink;

	beforeEach(() => {
		linkedEntity = createMockEntity({ id: 'linked-1', name: 'Test', type: 'character' });
		link = {
			id: 'link-1',
			targetId: 'linked-1',
			targetType: 'character',
			relationship: 'knows',
			bidirectional: true
		};
	});

	it('should call onRemove when remove button is clicked', async () => {
		const onRemove = vi.fn();

		render(RelationshipRow, {
			props: {
				linkedEntity,
				link,
				isReverse: false,
				selected: false,
				onSelect: vi.fn(),
				onRemove
			}
		});

		const removeButton = screen.getByRole('button', { name: /remove|delete/i });
		await fireEvent.click(removeButton);

		expect(onRemove).toHaveBeenCalledTimes(1);
	});

	it('should have danger/warning styling on remove button', () => {
		render(RelationshipRow, {
			props: {
				linkedEntity,
				link,
				isReverse: false,
				selected: false,
				onSelect: vi.fn(),
				onRemove: vi.fn()
			}
		});

		const removeButton = screen.getByRole('button', { name: /remove|delete/i });
		expect(removeButton).toHaveClass(/danger|warning|destructive|red/);
	});

	it('should have accessible label for remove button', () => {
		render(RelationshipRow, {
			props: {
				linkedEntity,
				link,
				isReverse: false,
				selected: false,
				onSelect: vi.fn(),
				onRemove: vi.fn()
			}
		});

		const removeButton = screen.getByRole('button', { name: /remove|delete/i });
		expect(removeButton).toHaveAccessibleName();
	});

	it('should hide remove button for reverse links', () => {
		render(RelationshipRow, {
			props: {
				linkedEntity,
				link,
				isReverse: true,
				selected: false,
				onSelect: vi.fn(),
				onRemove: vi.fn()
			}
		});

		const removeButton = screen.queryByRole('button', { name: /remove|delete/i });
		expect(removeButton).not.toBeInTheDocument();
	});
});

describe('RelationshipRow Component - Entity Link', () => {
	let linkedEntity: BaseEntity;
	let link: EntityLink;

	beforeEach(() => {
		linkedEntity = createMockEntity({ id: 'linked-1', name: 'Gandalf', type: 'npc' });
		link = {
			id: 'link-1',
			targetId: 'linked-1',
			targetType: 'npc',
			relationship: 'knows',
			bidirectional: true
		};
	});

	it('should render entity name as a link', () => {
		render(RelationshipRow, {
			props: {
				linkedEntity,
				link,
				isReverse: false,
				selected: false,
				onSelect: vi.fn(),
				onRemove: vi.fn()
			}
		});

		const entityLink = screen.getByRole('link', { name: /gandalf/i });
		expect(entityLink).toBeInTheDocument();
	});

	it('should have correct href for entity detail page', () => {
		render(RelationshipRow, {
			props: {
				linkedEntity,
				link,
				isReverse: false,
				selected: false,
				onSelect: vi.fn(),
				onRemove: vi.fn()
			}
		});

		const entityLink = screen.getByRole('link', { name: /gandalf/i });
		expect(entityLink).toHaveAttribute('href', '/entities/npc/linked-1');
	});
});

describe('RelationshipRow Component - Accessibility', () => {
	let linkedEntity: BaseEntity;
	let link: EntityLink;

	beforeEach(() => {
		linkedEntity = createMockEntity({ id: 'linked-1', name: 'Test', type: 'character' });
		link = {
			id: 'link-1',
			targetId: 'linked-1',
			targetType: 'character',
			relationship: 'knows',
			bidirectional: true
		};
	});

	it('should render as a table row', () => {
		const { container } = render(RelationshipRow, {
			props: {
				linkedEntity,
				link,
				isReverse: false,
				selected: false,
				onSelect: vi.fn(),
				onRemove: vi.fn()
			}
		});

		const row = container.querySelector('tr');
		expect(row).toBeInTheDocument();
	});

	it('should have proper column structure', () => {
		const { container } = render(RelationshipRow, {
			props: {
				linkedEntity,
				link,
				isReverse: false,
				selected: false,
				onSelect: vi.fn(),
				onRemove: vi.fn()
			}
		});

		const cells = container.querySelectorAll('td');
		// Should have: checkbox, target, type, relationship, strength, actions
		expect(cells.length).toBeGreaterThanOrEqual(5);
	});

	it('should support keyboard navigation for checkbox', () => {
		render(RelationshipRow, {
			props: {
				linkedEntity,
				link,
				isReverse: false,
				selected: false,
				onSelect: vi.fn(),
				onRemove: vi.fn()
			}
		});

		const checkbox = screen.getByRole('checkbox');
		expect(checkbox).toHaveAttribute('type', 'checkbox');
	});
});

describe('RelationshipRow Component - Edge Cases', () => {
	it('should handle entity with long name gracefully', () => {
		const linkedEntity = createMockEntity({
			id: 'linked-1',
			name: 'This is a very long entity name that might need truncation or wrapping',
			type: 'character'
		});

		const link: EntityLink = {
			id: 'link-1',
			targetId: 'linked-1',
			targetType: 'character',
			relationship: 'knows',
			bidirectional: true
		};

		render(RelationshipRow, {
			props: {
				linkedEntity,
				link,
				isReverse: false,
				selected: false,
				onSelect: vi.fn(),
				onRemove: vi.fn()
			}
		});

		expect(screen.getByText(/very long entity name/i)).toBeInTheDocument();
	});

	it('should handle custom relationship types', () => {
		const linkedEntity = createMockEntity({ id: 'linked-1', name: 'Test', type: 'character' });
		const link: EntityLink = {
			id: 'link-1',
			targetId: 'linked-1',
			targetType: 'character',
			relationship: 'custom_relationship_type',
			bidirectional: true
		};

		render(RelationshipRow, {
			props: {
				linkedEntity,
				link,
				isReverse: false,
				selected: false,
				onSelect: vi.fn(),
				onRemove: vi.fn()
			}
		});

		expect(screen.getByText(/custom_relationship_type/i)).toBeInTheDocument();
	});
});
