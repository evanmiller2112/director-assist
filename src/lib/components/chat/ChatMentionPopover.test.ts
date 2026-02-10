/**
 * Tests for ChatMentionPopover Component (TDD RED Phase)
 *
 * Issue #200: ChatMentionPopover Component
 *
 * This component provides autocomplete functionality for @mentions in the chat input.
 * It displays a filtered list of entities as the user types after "@".
 *
 * Props:
 * - entities: EntityStub[] (available entities to show)
 * - searchText: string (current search text after "@")
 * - visible: boolean (whether popover is shown)
 * - onSelect: (entity: EntityStub) => void (callback when entity is selected)
 * - onClose: () => void (callback when popover should close)
 *
 * Coverage:
 * - Rendering and visibility
 * - Entity filtering
 * - Keyboard navigation
 * - Selection handling
 * - Edge cases
 * - Accessibility
 *
 * These tests are expected to FAIL initially (RED phase).
 * The component will be created at: src/lib/components/chat/ChatMentionPopover.svelte
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import ChatMentionPopover from './ChatMentionPopover.svelte';
import type { EntityStub } from '$lib/services/mentionDetectionService';

// Helper to create mock entities
function createMockEntity(
	id: string,
	name: string,
	type: string = 'npc'
): EntityStub {
	return { id, name, type };
}

describe('ChatMentionPopover Component - Rendering', () => {
	const mockEntities: EntityStub[] = [
		createMockEntity('1', 'Gandalf', 'npc'),
		createMockEntity('2', 'Aragorn', 'character'),
		createMockEntity('3', 'Rivendell', 'location')
	];

	it('should render when visible is true', () => {
		const { container } = render(ChatMentionPopover, {
			props: {
				entities: mockEntities,
				searchText: '',
				visible: true,
				onSelect: vi.fn(),
				onClose: vi.fn()
			}
		});

		expect(container.querySelector('[role="listbox"]')).toBeInTheDocument();
	});

	it('should not render when visible is false', () => {
		const { container } = render(ChatMentionPopover, {
			props: {
				entities: mockEntities,
				searchText: '',
				visible: false,
				onSelect: vi.fn(),
				onClose: vi.fn()
			}
		});

		expect(container.querySelector('[role="listbox"]')).not.toBeInTheDocument();
	});

	it('should render list of entities', () => {
		render(ChatMentionPopover, {
			props: {
				entities: mockEntities,
				searchText: '',
				visible: true,
				onSelect: vi.fn(),
				onClose: vi.fn()
			}
		});

		const options = screen.getAllByRole('option');
		expect(options.length).toBe(3);
	});

	it('should display entity names', () => {
		render(ChatMentionPopover, {
			props: {
				entities: mockEntities,
				searchText: '',
				visible: true,
				onSelect: vi.fn(),
				onClose: vi.fn()
			}
		});

		expect(screen.getByText('Gandalf')).toBeInTheDocument();
		expect(screen.getByText('Aragorn')).toBeInTheDocument();
		expect(screen.getByText('Rivendell')).toBeInTheDocument();
	});

	it('should display entity type alongside name', () => {
		render(ChatMentionPopover, {
			props: {
				entities: mockEntities,
				searchText: '',
				visible: true,
				onSelect: vi.fn(),
				onClose: vi.fn()
			}
		});

		// Types should be displayed (e.g., "(npc)", "(character)", "(location)")
		expect(screen.getByText(/npc/i)).toBeInTheDocument();
		expect(screen.getByText(/character/i)).toBeInTheDocument();
		expect(screen.getByText(/location/i)).toBeInTheDocument();
	});

	it('should show all entities when searchText is empty', () => {
		render(ChatMentionPopover, {
			props: {
				entities: mockEntities,
				searchText: '',
				visible: true,
				onSelect: vi.fn(),
				onClose: vi.fn()
			}
		});

		const options = screen.getAllByRole('option');
		expect(options.length).toBe(3);
	});

	it('should have proper ARIA roles', () => {
		render(ChatMentionPopover, {
			props: {
				entities: mockEntities,
				searchText: '',
				visible: true,
				onSelect: vi.fn(),
				onClose: vi.fn()
			}
		});

		const listbox = screen.getByRole('listbox');
		expect(listbox).toBeInTheDocument();

		const options = screen.getAllByRole('option');
		expect(options.length).toBeGreaterThan(0);
	});

	it('should have accessible label for listbox', () => {
		render(ChatMentionPopover, {
			props: {
				entities: mockEntities,
				searchText: '',
				visible: true,
				onSelect: vi.fn(),
				onClose: vi.fn()
			}
		});

		const listbox = screen.getByRole('listbox');
		expect(
			listbox.getAttribute('aria-label') ||
			listbox.getAttribute('aria-labelledby')
		).toBeTruthy();
	});
});

describe('ChatMentionPopover Component - Filtering', () => {
	const mockEntities: EntityStub[] = [
		createMockEntity('1', 'Gandalf the Grey', 'npc'),
		createMockEntity('2', 'Gandalf the White', 'npc'),
		createMockEntity('3', 'Aragorn', 'character'),
		createMockEntity('4', 'Gimli', 'character'),
		createMockEntity('5', 'Rivendell', 'location')
	];

	it('should filter entities by prefix match (case-insensitive)', () => {
		render(ChatMentionPopover, {
			props: {
				entities: mockEntities,
				searchText: 'gan',
				visible: true,
				onSelect: vi.fn(),
				onClose: vi.fn()
			}
		});

		expect(screen.getByText(/Gandalf the Grey/i)).toBeInTheDocument();
		expect(screen.getByText(/Gandalf the White/i)).toBeInTheDocument();
		expect(screen.queryByText('Aragorn')).not.toBeInTheDocument();
	});

	it('should filter entities by substring match', () => {
		render(ChatMentionPopover, {
			props: {
				entities: mockEntities,
				searchText: 'alf',
				visible: true,
				onSelect: vi.fn(),
				onClose: vi.fn()
			}
		});

		expect(screen.getByText(/Gandalf the Grey/i)).toBeInTheDocument();
		expect(screen.getByText(/Gandalf the White/i)).toBeInTheDocument();
		expect(screen.queryByText('Aragorn')).not.toBeInTheDocument();
	});

	it('should filter case-insensitively', () => {
		render(ChatMentionPopover, {
			props: {
				entities: mockEntities,
				searchText: 'ARAGORN',
				visible: true,
				onSelect: vi.fn(),
				onClose: vi.fn()
			}
		});

		expect(screen.getByText('Aragorn')).toBeInTheDocument();
		expect(screen.queryByText(/Gandalf/i)).not.toBeInTheDocument();
	});

	it('should show "No matches found" when no entities match', () => {
		render(ChatMentionPopover, {
			props: {
				entities: mockEntities,
				searchText: 'NonexistentEntity',
				visible: true,
				onSelect: vi.fn(),
				onClose: vi.fn()
			}
		});

		expect(screen.getByText(/no matches found/i)).toBeInTheDocument();
	});

	it('should show "No matches found" when entities array is empty', () => {
		render(ChatMentionPopover, {
			props: {
				entities: [],
				searchText: 'test',
				visible: true,
				onSelect: vi.fn(),
				onClose: vi.fn()
			}
		});

		expect(screen.getByText(/no matches found/i)).toBeInTheDocument();
	});

	it('should rank prefix matches higher than substring matches', () => {
		const testEntities: EntityStub[] = [
			createMockEntity('1', 'Gandalf', 'npc'),
			createMockEntity('2', 'The Grand Wizard Gandalf', 'npc')
		];

		render(ChatMentionPopover, {
			props: {
				entities: testEntities,
				searchText: 'Gan',
				visible: true,
				onSelect: vi.fn(),
				onClose: vi.fn()
			}
		});

		const options = screen.getAllByRole('option');
		// "Gandalf" should come before "The Grand Wizard Gandalf"
		expect(options[0]).toHaveTextContent('Gandalf');
	});

	it('should handle empty searchText by showing all entities', () => {
		render(ChatMentionPopover, {
			props: {
				entities: mockEntities,
				searchText: '',
				visible: true,
				onSelect: vi.fn(),
				onClose: vi.fn()
			}
		});

		const options = screen.getAllByRole('option');
		expect(options.length).toBe(5);
	});

	it('should handle whitespace in searchText', () => {
		render(ChatMentionPopover, {
			props: {
				entities: mockEntities,
				searchText: '  gan  ',
				visible: true,
				onSelect: vi.fn(),
				onClose: vi.fn()
			}
		});

		// Should trim and still match
		expect(screen.getByText(/Gandalf the Grey/i)).toBeInTheDocument();
	});
});

describe('ChatMentionPopover Component - Keyboard Navigation', () => {
	const mockEntities: EntityStub[] = [
		createMockEntity('1', 'Entity One', 'npc'),
		createMockEntity('2', 'Entity Two', 'character'),
		createMockEntity('3', 'Entity Three', 'location')
	];

	it('should highlight first item by default when popover opens', () => {
		render(ChatMentionPopover, {
			props: {
				entities: mockEntities,
				searchText: '',
				visible: true,
				onSelect: vi.fn(),
				onClose: vi.fn()
			}
		});

		const options = screen.getAllByRole('option');
		expect(options[0]).toHaveAttribute('aria-selected', 'true');
	});

	it('should move highlight down on ArrowDown key', async () => {
		const { container } = render(ChatMentionPopover, {
			props: {
				entities: mockEntities,
				searchText: '',
				visible: true,
				onSelect: vi.fn(),
				onClose: vi.fn()
			}
		});

		const listbox = screen.getByRole('listbox');
		await fireEvent.keyDown(listbox, { key: 'ArrowDown' });

		const options = screen.getAllByRole('option');
		expect(options[1]).toHaveAttribute('aria-selected', 'true');
	});

	it('should move highlight up on ArrowUp key', async () => {
		const { container } = render(ChatMentionPopover, {
			props: {
				entities: mockEntities,
				searchText: '',
				visible: true,
				onSelect: vi.fn(),
				onClose: vi.fn()
			}
		});

		const listbox = screen.getByRole('listbox');

		// Move down first
		await fireEvent.keyDown(listbox, { key: 'ArrowDown' });
		// Then move up
		await fireEvent.keyDown(listbox, { key: 'ArrowUp' });

		const options = screen.getAllByRole('option');
		expect(options[0]).toHaveAttribute('aria-selected', 'true');
	});

	it('should wrap around from last to first on ArrowDown', async () => {
		render(ChatMentionPopover, {
			props: {
				entities: mockEntities,
				searchText: '',
				visible: true,
				onSelect: vi.fn(),
				onClose: vi.fn()
			}
		});

		const listbox = screen.getByRole('listbox');

		// Move to last item
		await fireEvent.keyDown(listbox, { key: 'ArrowDown' });
		await fireEvent.keyDown(listbox, { key: 'ArrowDown' });

		// Press ArrowDown again to wrap
		await fireEvent.keyDown(listbox, { key: 'ArrowDown' });

		const options = screen.getAllByRole('option');
		expect(options[0]).toHaveAttribute('aria-selected', 'true');
	});

	it('should wrap around from first to last on ArrowUp', async () => {
		render(ChatMentionPopover, {
			props: {
				entities: mockEntities,
				searchText: '',
				visible: true,
				onSelect: vi.fn(),
				onClose: vi.fn()
			}
		});

		const listbox = screen.getByRole('listbox');

		// First item is selected by default, press ArrowUp to wrap to last
		await fireEvent.keyDown(listbox, { key: 'ArrowUp' });

		const options = screen.getAllByRole('option');
		expect(options[2]).toHaveAttribute('aria-selected', 'true');
	});

	it('should call onSelect with highlighted entity on Enter key', async () => {
		const onSelect = vi.fn();
		render(ChatMentionPopover, {
			props: {
				entities: mockEntities,
				searchText: '',
				visible: true,
				onSelect,
				onClose: vi.fn()
			}
		});

		const listbox = screen.getByRole('listbox');
		await fireEvent.keyDown(listbox, { key: 'Enter' });

		expect(onSelect).toHaveBeenCalledWith(mockEntities[0]);
	});

	it('should call onSelect with correct entity after navigation', async () => {
		const onSelect = vi.fn();
		render(ChatMentionPopover, {
			props: {
				entities: mockEntities,
				searchText: '',
				visible: true,
				onSelect,
				onClose: vi.fn()
			}
		});

		const listbox = screen.getByRole('listbox');

		// Navigate to second item
		await fireEvent.keyDown(listbox, { key: 'ArrowDown' });
		await fireEvent.keyDown(listbox, { key: 'Enter' });

		expect(onSelect).toHaveBeenCalledWith(mockEntities[1]);
	});

	it('should call onClose on Escape key', async () => {
		const onClose = vi.fn();
		render(ChatMentionPopover, {
			props: {
				entities: mockEntities,
				searchText: '',
				visible: true,
				onSelect: vi.fn(),
				onClose
			}
		});

		const listbox = screen.getByRole('listbox');
		await fireEvent.keyDown(listbox, { key: 'Escape' });

		expect(onClose).toHaveBeenCalled();
	});

	it('should update aria-selected when navigating', async () => {
		render(ChatMentionPopover, {
			props: {
				entities: mockEntities,
				searchText: '',
				visible: true,
				onSelect: vi.fn(),
				onClose: vi.fn()
			}
		});

		const options = screen.getAllByRole('option');

		// Initially first is selected
		expect(options[0]).toHaveAttribute('aria-selected', 'true');
		expect(options[1]).toHaveAttribute('aria-selected', 'false');

		const listbox = screen.getByRole('listbox');
		await fireEvent.keyDown(listbox, { key: 'ArrowDown' });

		// After ArrowDown, second is selected
		expect(options[0]).toHaveAttribute('aria-selected', 'false');
		expect(options[1]).toHaveAttribute('aria-selected', 'true');
	});

	it('should handle keyboard navigation with single entity', async () => {
		const singleEntity = [createMockEntity('1', 'Solo Entity', 'npc')];

		render(ChatMentionPopover, {
			props: {
				entities: singleEntity,
				searchText: '',
				visible: true,
				onSelect: vi.fn(),
				onClose: vi.fn()
			}
		});

		const listbox = screen.getByRole('listbox');

		// Should not crash when navigating with only one item
		await fireEvent.keyDown(listbox, { key: 'ArrowDown' });
		await fireEvent.keyDown(listbox, { key: 'ArrowUp' });

		const option = screen.getByRole('option');
		expect(option).toHaveAttribute('aria-selected', 'true');
	});

	it('should ignore other keys', async () => {
		render(ChatMentionPopover, {
			props: {
				entities: mockEntities,
				searchText: '',
				visible: true,
				onSelect: vi.fn(),
				onClose: vi.fn()
			}
		});

		const listbox = screen.getByRole('listbox');
		const options = screen.getAllByRole('option');

		// Press random key
		await fireEvent.keyDown(listbox, { key: 'a' });

		// Selection should not change
		expect(options[0]).toHaveAttribute('aria-selected', 'true');
	});
});

describe('ChatMentionPopover Component - Mouse Selection', () => {
	const mockEntities: EntityStub[] = [
		createMockEntity('1', 'Entity One', 'npc'),
		createMockEntity('2', 'Entity Two', 'character'),
		createMockEntity('3', 'Entity Three', 'location')
	];

	it('should call onSelect when an entity item is clicked', async () => {
		const onSelect = vi.fn();
		render(ChatMentionPopover, {
			props: {
				entities: mockEntities,
				searchText: '',
				visible: true,
				onSelect,
				onClose: vi.fn()
			}
		});

		const options = screen.getAllByRole('option');
		await fireEvent.click(options[1]);

		expect(onSelect).toHaveBeenCalledWith(mockEntities[1]);
	});

	it('should call onSelect with correct entity data', async () => {
		const onSelect = vi.fn();
		render(ChatMentionPopover, {
			props: {
				entities: mockEntities,
				searchText: '',
				visible: true,
				onSelect,
				onClose: vi.fn()
			}
		});

		const options = screen.getAllByRole('option');
		await fireEvent.click(options[0]);

		expect(onSelect).toHaveBeenCalledWith({
			id: '1',
			name: 'Entity One',
			type: 'npc'
		});
	});

	it('should highlight item on mouse enter', async () => {
		render(ChatMentionPopover, {
			props: {
				entities: mockEntities,
				searchText: '',
				visible: true,
				onSelect: vi.fn(),
				onClose: vi.fn()
			}
		});

		const options = screen.getAllByRole('option');

		// Hover over second item
		await fireEvent.mouseEnter(options[1]);

		expect(options[1]).toHaveAttribute('aria-selected', 'true');
		expect(options[0]).toHaveAttribute('aria-selected', 'false');
	});

	it('should handle clicking after keyboard navigation', async () => {
		const onSelect = vi.fn();
		render(ChatMentionPopover, {
			props: {
				entities: mockEntities,
				searchText: '',
				visible: true,
				onSelect,
				onClose: vi.fn()
			}
		});

		const listbox = screen.getByRole('listbox');
		const options = screen.getAllByRole('option');

		// Navigate with keyboard
		await fireEvent.keyDown(listbox, { key: 'ArrowDown' });

		// Then click a different item
		await fireEvent.click(options[2]);

		expect(onSelect).toHaveBeenCalledWith(mockEntities[2]);
	});

	it('should work without onSelect callback', async () => {
		const { container } = render(ChatMentionPopover, {
			props: {
				entities: mockEntities,
				searchText: '',
				visible: true,
				onClose: vi.fn()
			}
		});

		const options = screen.getAllByRole('option');

		// Should not crash
		await expect(fireEvent.click(options[0])).resolves.not.toThrow();
	});
});

describe('ChatMentionPopover Component - Edge Cases', () => {
	it('should handle empty entities array', () => {
		render(ChatMentionPopover, {
			props: {
				entities: [],
				searchText: '',
				visible: true,
				onSelect: vi.fn(),
				onClose: vi.fn()
			}
		});

		expect(screen.getByText(/no matches found/i)).toBeInTheDocument();
	});

	it('should handle very long entity names', () => {
		const longNameEntity = createMockEntity(
			'1',
			'This is an extremely long entity name that should be truncated or wrapped properly in the UI',
			'npc'
		);

		const { container } = render(ChatMentionPopover, {
			props: {
				entities: [longNameEntity],
				searchText: '',
				visible: true,
				onSelect: vi.fn(),
				onClose: vi.fn()
			}
		});

		// Should render without breaking layout
		expect(container.querySelector('[role="option"]')).toBeInTheDocument();
	});

	it('should limit visible results to maximum (10 items)', () => {
		const manyEntities: EntityStub[] = Array.from({ length: 20 }, (_, i) =>
			createMockEntity(`${i}`, `Entity ${i}`, 'npc')
		);

		const { container } = render(ChatMentionPopover, {
			props: {
				entities: manyEntities,
				searchText: '',
				visible: true,
				onSelect: vi.fn(),
				onClose: vi.fn()
			}
		});

		const options = screen.getAllByRole('option');
		expect(options.length).toBeLessThanOrEqual(10);
	});

	it('should handle special characters in entity names', () => {
		const specialEntities: EntityStub[] = [
			createMockEntity('1', "O'Brien", 'npc'),
			createMockEntity('2', 'Café-du-Monde', 'location'),
			createMockEntity('3', 'Entity & Co.', 'faction')
		];

		render(ChatMentionPopover, {
			props: {
				entities: specialEntities,
				searchText: '',
				visible: true,
				onSelect: vi.fn(),
				onClose: vi.fn()
			}
		});

		expect(screen.getByText("O'Brien")).toBeInTheDocument();
		expect(screen.getByText('Café-du-Monde')).toBeInTheDocument();
	});

	it('should handle entities with same name but different types', () => {
		const duplicateNameEntities: EntityStub[] = [
			createMockEntity('1', 'Shadow', 'npc'),
			createMockEntity('2', 'Shadow', 'location'),
			createMockEntity('3', 'Shadow', 'faction')
		];

		render(ChatMentionPopover, {
			props: {
				entities: duplicateNameEntities,
				searchText: '',
				visible: true,
				onSelect: vi.fn(),
				onClose: vi.fn()
			}
		});

		const options = screen.getAllByRole('option');
		expect(options.length).toBe(3);

		// All should show "Shadow" but with different types
		expect(screen.getByText(/npc/i)).toBeInTheDocument();
		expect(screen.getByText(/location/i)).toBeInTheDocument();
		expect(screen.getByText(/faction/i)).toBeInTheDocument();
	});

	it('should handle rapid prop changes', async () => {
		const { rerender } = render(ChatMentionPopover, {
			props: {
				entities: [createMockEntity('1', 'First', 'npc')],
				searchText: 'f',
				visible: true,
				onSelect: vi.fn(),
				onClose: vi.fn()
			}
		});

		// Rapid updates
		await rerender({
			entities: [createMockEntity('2', 'Second', 'character')],
			searchText: 's',
			visible: true,
			onSelect: vi.fn(),
			onClose: vi.fn()
		});

		await rerender({
			entities: [createMockEntity('3', 'Third', 'location')],
			searchText: 't',
			visible: true,
			onSelect: vi.fn(),
			onClose: vi.fn()
		});

		expect(screen.getByText('Third')).toBeInTheDocument();
	});

	it('should reset highlighted index when filtered results change', async () => {
		const allEntities: EntityStub[] = [
			createMockEntity('1', 'Gandalf', 'npc'),
			createMockEntity('2', 'Aragorn', 'character'),
			createMockEntity('3', 'Gimli', 'character')
		];

		const { rerender } = render(ChatMentionPopover, {
			props: {
				entities: allEntities,
				searchText: '',
				visible: true,
				onSelect: vi.fn(),
				onClose: vi.fn()
			}
		});

		const listbox = screen.getByRole('listbox');

		// Navigate to second item
		await fireEvent.keyDown(listbox, { key: 'ArrowDown' });

		// Change search to filter results
		await rerender({
			entities: allEntities,
			searchText: 'gan',
			visible: true,
			onSelect: vi.fn(),
			onClose: vi.fn()
		});

		// First item of new filtered list should be selected
		const options = screen.getAllByRole('option');
		expect(options[0]).toHaveAttribute('aria-selected', 'true');
	});

	it('should handle visibility toggle without errors', async () => {
		const { rerender } = render(ChatMentionPopover, {
			props: {
				entities: [createMockEntity('1', 'Test', 'npc')],
				searchText: '',
				visible: false,
				onSelect: vi.fn(),
				onClose: vi.fn()
			}
		});

		// Show
		await rerender({
			entities: [createMockEntity('1', 'Test', 'npc')],
			searchText: '',
			visible: true,
			onSelect: vi.fn(),
			onClose: vi.fn()
		});

		expect(screen.getByRole('listbox')).toBeInTheDocument();

		// Hide
		await rerender({
			entities: [createMockEntity('1', 'Test', 'npc')],
			searchText: '',
			visible: false,
			onSelect: vi.fn(),
			onClose: vi.fn()
		});

		expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
	});
});

describe('ChatMentionPopover Component - Accessibility', () => {
	const mockEntities: EntityStub[] = [
		createMockEntity('1', 'Entity One', 'npc'),
		createMockEntity('2', 'Entity Two', 'character')
	];

	it('should have proper ARIA roles', () => {
		render(ChatMentionPopover, {
			props: {
				entities: mockEntities,
				searchText: '',
				visible: true,
				onSelect: vi.fn(),
				onClose: vi.fn()
			}
		});

		expect(screen.getByRole('listbox')).toBeInTheDocument();
		const options = screen.getAllByRole('option');
		expect(options.length).toBeGreaterThan(0);
	});

	it('should mark selected item with aria-selected', () => {
		render(ChatMentionPopover, {
			props: {
				entities: mockEntities,
				searchText: '',
				visible: true,
				onSelect: vi.fn(),
				onClose: vi.fn()
			}
		});

		const options = screen.getAllByRole('option');
		expect(options[0]).toHaveAttribute('aria-selected', 'true');
		expect(options[1]).toHaveAttribute('aria-selected', 'false');
	});

	it('should have accessible labels', () => {
		render(ChatMentionPopover, {
			props: {
				entities: mockEntities,
				searchText: '',
				visible: true,
				onSelect: vi.fn(),
				onClose: vi.fn()
			}
		});

		const listbox = screen.getByRole('listbox');
		const label = listbox.getAttribute('aria-label') || listbox.getAttribute('aria-labelledby');
		expect(label).toBeTruthy();
	});

	it('should associate options with accessible text', () => {
		render(ChatMentionPopover, {
			props: {
				entities: mockEntities,
				searchText: '',
				visible: true,
				onSelect: vi.fn(),
				onClose: vi.fn()
			}
		});

		const options = screen.getAllByRole('option');
		options.forEach(option => {
			// Each option should have accessible text content
			expect(option.textContent).toBeTruthy();
		});
	});

	it('should support keyboard-only interaction', async () => {
		const onSelect = vi.fn();
		const onClose = vi.fn();

		render(ChatMentionPopover, {
			props: {
				entities: mockEntities,
				searchText: '',
				visible: true,
				onSelect,
				onClose
			}
		});

		const listbox = screen.getByRole('listbox');

		// Navigate with keyboard only
		await fireEvent.keyDown(listbox, { key: 'ArrowDown' });
		await fireEvent.keyDown(listbox, { key: 'Enter' });

		expect(onSelect).toHaveBeenCalled();
	});

	it('should announce no results to screen readers', () => {
		render(ChatMentionPopover, {
			props: {
				entities: [],
				searchText: 'nothing',
				visible: true,
				onSelect: vi.fn(),
				onClose: vi.fn()
			}
		});

		// "No matches found" should be announced
		const message = screen.getByText(/no matches found/i);
		expect(message).toBeInTheDocument();
	});
});

describe('ChatMentionPopover Component - Layout and Styling', () => {
	const mockEntities: EntityStub[] = [
		createMockEntity('1', 'Test Entity', 'npc')
	];

	it('should position popover appropriately', () => {
		const { container } = render(ChatMentionPopover, {
			props: {
				entities: mockEntities,
				searchText: '',
				visible: true,
				onSelect: vi.fn(),
				onClose: vi.fn()
			}
		});

		const listbox = screen.getByRole('listbox');
		// Should have positioning classes (absolute, fixed, etc.)
		expect(
			listbox.className.includes('absolute') ||
			listbox.className.includes('fixed') ||
			listbox.className.includes('relative')
		).toBeTruthy();
	});

	it('should have consistent styling with existing UI', () => {
		render(ChatMentionPopover, {
			props: {
				entities: mockEntities,
				searchText: '',
				visible: true,
				onSelect: vi.fn(),
				onClose: vi.fn()
			}
		});

		const listbox = screen.getByRole('listbox');
		// Should use Tailwind classes
		expect(listbox.className.length).toBeGreaterThan(0);
	});

	it('should show scrollbar when results exceed viewport', () => {
		const manyEntities: EntityStub[] = Array.from({ length: 15 }, (_, i) =>
			createMockEntity(`${i}`, `Entity ${i}`, 'npc')
		);

		const { container } = render(ChatMentionPopover, {
			props: {
				entities: manyEntities,
				searchText: '',
				visible: true,
				onSelect: vi.fn(),
				onClose: vi.fn()
			}
		});

		const listbox = screen.getByRole('listbox');
		// Should have overflow/scroll classes
		expect(
			listbox.className.includes('overflow') ||
			listbox.className.includes('scroll')
		).toBeTruthy();
	});

	it('should highlight selected item visually', () => {
		render(ChatMentionPopover, {
			props: {
				entities: mockEntities,
				searchText: '',
				visible: true,
				onSelect: vi.fn(),
				onClose: vi.fn()
			}
		});

		const options = screen.getAllByRole('option');
		// Selected option should have visual highlighting classes
		expect(options[0].className.length).toBeGreaterThan(0);
	});

	it('should display entity type badge or indicator', () => {
		render(ChatMentionPopover, {
			props: {
				entities: mockEntities,
				searchText: '',
				visible: true,
				onSelect: vi.fn(),
				onClose: vi.fn()
			}
		});

		// Type should be displayed with some styling
		const typeElement = screen.getByText(/npc/i);
		expect(typeElement).toBeInTheDocument();
	});
});
