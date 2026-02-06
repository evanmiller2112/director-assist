/**
 * Tests for TableVisualization Component (GitHub Issue #318)
 *
 * Component: Visual representation of a seating chart showing:
 * - Correct number of seats (4-10)
 * - Character names for assigned seats
 * - Player names from character's playerName field
 * - DM crown icon at dmPosition
 * - Different visual layouts for oval vs rectangular shapes
 * - Clickable seats that trigger onSeatClick callback
 *
 * Props:
 * - tableMap: TableMap - The table configuration and assignments
 * - characters: BaseEntity[] - List of character entities
 * - onSeatClick: (seatIndex: number) => void - Callback when seat is clicked
 * - readonly?: boolean - If true, seats are not clickable
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import type { BaseEntity } from '$lib/types';
import type { TableMap } from '$lib/types/campaign';
import TableVisualization from './TableVisualization.svelte';

describe('TableVisualization Component - Basic Rendering', () => {
	it('should render without crashing with minimal props', async () => {
		// Arrange: Minimal table map
		const tableMap: TableMap = {
			seats: 4,
			shape: 'oval',
			dmPosition: 0,
			assignments: []
		};

		// Act & Assert
		const { container } = render(TableVisualization, {
			props: {
				tableMap,
				characters: [],
				onSeatClick: vi.fn()
			}
		});
		expect(container).toBeInTheDocument();
	});

	it('should render correct number of seats for 4-seat table', () => {
		const tableMap: TableMap = {
			seats: 4,
			shape: 'oval',
			dmPosition: 0,
			assignments: []
		};

		render(TableVisualization, {
			props: { tableMap, characters: [], onSeatClick: vi.fn() }
		});

		const seats = screen.getAllByRole('button', { name: /seat \d+/i });
		expect(seats).toHaveLength(4);
	});

	it('should render correct number of seats for 6-seat table', () => {
		const tableMap: TableMap = {
			seats: 6,
			shape: 'rectangular',
			dmPosition: 0,
			assignments: []
		};

		render(TableVisualization, {
			props: { tableMap, characters: [], onSeatClick: vi.fn() }
		});

		const seats = screen.getAllByRole('button', { name: /seat \d+/i });
		expect(seats).toHaveLength(6);
	});

	it('should render correct number of seats for 10-seat table', () => {
		const tableMap: TableMap = {
			seats: 10,
			shape: 'oval',
			dmPosition: 5,
			assignments: []
		};

		render(TableVisualization, {
			props: { tableMap, characters: [], onSeatClick: vi.fn() }
		});

		const seats = screen.getAllByRole('button', { name: /seat \d+/i });
		expect(seats).toHaveLength(10);
	});
});

describe('TableVisualization Component - Character and Player Name Display', () => {
	const mockCharacters: BaseEntity[] = [
		{
			id: 'char-1',
			type: 'character',
			name: 'Gandalf',
			description: '',
			tags: [],
			fields: { playerName: 'Alice' },
			links: [],
			notes: '',
			createdAt: new Date(),
			updatedAt: new Date()
		},
		{
			id: 'char-2',
			type: 'character',
			name: 'Aragorn',
			description: '',
			tags: [],
			fields: { playerName: 'Bob' },
			links: [],
			notes: '',
			createdAt: new Date(),
			updatedAt: new Date()
		}
	];

	it('should display character name for assigned seat', () => {
		const tableMap: TableMap = {
			seats: 6,
			shape: 'oval',
			dmPosition: 0,
			assignments: [{ seatIndex: 1, characterId: 'char-1' }]
		};

		render(TableVisualization, {
			props: {
				tableMap,
				characters: mockCharacters,
				onSeatClick: vi.fn()
			}
		});

		expect(screen.getByText('Gandalf')).toBeInTheDocument();
	});

	it('should display player name from character playerName field', () => {
		const tableMap: TableMap = {
			seats: 6,
			shape: 'oval',
			dmPosition: 0,
			assignments: [{ seatIndex: 1, characterId: 'char-1' }]
		};

		render(TableVisualization, {
			props: {
				tableMap,
				characters: mockCharacters,
				onSeatClick: vi.fn()
			}
		});

		expect(screen.getByText('Gandalf')).toBeInTheDocument();
		expect(screen.getByText('Alice')).toBeInTheDocument();
	});

	it('should display multiple character assignments', () => {
		const tableMap: TableMap = {
			seats: 6,
			shape: 'oval',
			dmPosition: 0,
			assignments: [
				{ seatIndex: 1, characterId: 'char-1' },
				{ seatIndex: 2, characterId: 'char-2' }
			]
		};

		render(TableVisualization, {
			props: {
				tableMap,
				characters: mockCharacters,
				onSeatClick: vi.fn()
			}
		});

		expect(screen.getByText('Gandalf')).toBeInTheDocument();
		expect(screen.getByText('Aragorn')).toBeInTheDocument();
		expect(screen.getByText('Alice')).toBeInTheDocument();
		expect(screen.getByText('Bob')).toBeInTheDocument();
	});

	it('should display "Empty" for unassigned seats', () => {
		const tableMap: TableMap = {
			seats: 4,
			shape: 'oval',
			dmPosition: 0,
			assignments: [{ seatIndex: 1, characterId: 'char-1' }]
		};

		render(TableVisualization, {
			props: {
				tableMap,
				characters: mockCharacters,
				onSeatClick: vi.fn()
			}
		});

		// Should have empty seats (seats 2, 3 - excluding DM position and assigned seat)
		const emptySeats = screen.getAllByText(/empty/i);
		expect(emptySeats.length).toBeGreaterThan(0);
	});

	it('should handle character without playerName field', () => {
		const characterWithoutPlayer: BaseEntity[] = [
			{
				id: 'char-no-player',
				type: 'character',
				name: 'Legolas',
				description: '',
				tags: [],
				fields: {},
				links: [],
				notes: '',
				createdAt: new Date(),
				updatedAt: new Date()
			}
		];

		const tableMap: TableMap = {
			seats: 6,
			shape: 'oval',
			dmPosition: 0,
			assignments: [{ seatIndex: 1, characterId: 'char-no-player' }]
		};

		render(TableVisualization, {
			props: {
				tableMap,
				characters: characterWithoutPlayer,
				onSeatClick: vi.fn()
			}
		});

		// Character name should still show
		expect(screen.getByText('Legolas')).toBeInTheDocument();
	});
});

describe('TableVisualization Component - DM Position', () => {
	it('should display DM crown icon at dmPosition', () => {
		const tableMap: TableMap = {
			seats: 6,
			shape: 'oval',
			dmPosition: 0,
			assignments: []
		};

		render(TableVisualization, {
			props: {
				tableMap,
				characters: [],
				onSeatClick: vi.fn()
			}
		});

		// Check for DM indicator (crown icon or "Director" text)
		const dmIndicator = screen.getByRole('button', { name: /seat 0/i });
		expect(dmIndicator).toHaveTextContent(/Director/i);
	});

	it('should display DM crown at different positions', () => {
		const tableMap: TableMap = {
			seats: 8,
			shape: 'rectangular',
			dmPosition: 4,
			assignments: []
		};

		render(TableVisualization, {
			props: {
				tableMap,
				characters: [],
				onSeatClick: vi.fn()
			}
		});

		const dmSeat = screen.getByRole('button', { name: /seat 4/i });
		expect(dmSeat).toHaveTextContent(/Director/i);
	});

	it('should not show DM crown when dmPosition is undefined', () => {
		const tableMap: TableMap = {
			seats: 6,
			shape: 'oval',
			dmPosition: undefined,
			assignments: []
		};

		render(TableVisualization, {
			props: {
				tableMap,
				characters: [],
				onSeatClick: vi.fn()
			}
		});

		// Should not have any Director indicators
		expect(screen.queryByText(/Director/i)).not.toBeInTheDocument();
	});

	it('should visually distinguish DM seat from player seats', () => {
		const tableMap: TableMap = {
			seats: 6,
			shape: 'oval',
			dmPosition: 0,
			assignments: []
		};

		render(TableVisualization, {
			props: {
				tableMap,
				characters: [],
				onSeatClick: vi.fn()
			}
		});

		const dmSeat = screen.getByRole('button', { name: /seat 0/i });
		// DM seat should have different styling class
		expect(dmSeat).toHaveClass('dm-seat');
	});
});

describe('TableVisualization Component - Table Shapes', () => {
	it('should apply oval shape styling', () => {
		const tableMap: TableMap = {
			seats: 6,
			shape: 'oval',
			dmPosition: 0,
			assignments: []
		};

		const { container } = render(TableVisualization, {
			props: {
				tableMap,
				characters: [],
				onSeatClick: vi.fn()
			}
		});

		// Container should have oval-specific data attribute
		const tableContainer = container.querySelector('[data-shape="oval"]');
		expect(tableContainer).toBeInTheDocument();
	});

	it('should apply rectangular shape styling', () => {
		const tableMap: TableMap = {
			seats: 8,
			shape: 'rectangular',
			dmPosition: 0,
			assignments: []
		};

		const { container } = render(TableVisualization, {
			props: {
				tableMap,
				characters: [],
				onSeatClick: vi.fn()
			}
		});

		// Container should have rectangular-specific data attribute
		const tableContainer = container.querySelector('[data-shape="rectangular"]');
		expect(tableContainer).toBeInTheDocument();
	});

	it('should arrange seats differently for oval vs rectangular', () => {
		const ovalTableMap: TableMap = {
			seats: 6,
			shape: 'oval',
			dmPosition: 0,
			assignments: []
		};

		const rectTableMap: TableMap = {
			seats: 6,
			shape: 'rectangular',
			dmPosition: 0,
			assignments: []
		};

		const { container: ovalContainer } = render(TableVisualization, {
			props: {
				tableMap: ovalTableMap,
				characters: [],
				onSeatClick: vi.fn()
			}
		});

		const { container: rectContainer } = render(TableVisualization, {
			props: {
				tableMap: rectTableMap,
				characters: [],
				onSeatClick: vi.fn()
			}
		});

		// Layouts should be different (different data-shape attributes)
		expect(ovalContainer.innerHTML).not.toBe(rectContainer.innerHTML);
	});
});

describe('TableVisualization Component - Seat Click Interaction', () => {
	it('should call onSeatClick when seat is clicked', async () => {
		const onSeatClick = vi.fn();
		const tableMap: TableMap = {
			seats: 6,
			shape: 'oval',
			dmPosition: 0,
			assignments: []
		};

		render(TableVisualization, {
			props: {
				tableMap,
				characters: [],
				onSeatClick
			}
		});

		const seat1 = screen.getByRole('button', { name: /seat 1/i });
		await fireEvent.click(seat1);

		expect(onSeatClick).toHaveBeenCalledWith(1);
	});

	it('should call onSeatClick with correct seat index for multiple seats', async () => {
		const onSeatClick = vi.fn();
		const tableMap: TableMap = {
			seats: 6,
			shape: 'oval',
			dmPosition: 0,
			assignments: []
		};

		render(TableVisualization, {
			props: {
				tableMap,
				characters: [],
				onSeatClick
			}
		});

		const seat3 = screen.getByRole('button', { name: /seat 3/i });
		await fireEvent.click(seat3);

		expect(onSeatClick).toHaveBeenCalledWith(3);
		expect(onSeatClick).toHaveBeenCalledTimes(1);
	});

	it('should allow clicking DM seat', async () => {
		const onSeatClick = vi.fn();
		const tableMap: TableMap = {
			seats: 6,
			shape: 'oval',
			dmPosition: 0,
			assignments: []
		};

		render(TableVisualization, {
			props: {
				tableMap,
				characters: [],
				onSeatClick
			}
		});

		const dmSeat = screen.getByRole('button', { name: /seat 0/i });
		await fireEvent.click(dmSeat);

		expect(onSeatClick).toHaveBeenCalledWith(0);
	});

	it('should allow clicking assigned seats', async () => {
		const onSeatClick = vi.fn();
		const mockCharacters: BaseEntity[] = [
			{
				id: 'char-1',
				type: 'character',
				name: 'Gandalf',
				description: '',
				tags: [],
				fields: { playerName: 'Alice' },
				links: [],
				notes: '',
				createdAt: new Date(),
				updatedAt: new Date()
			}
		];

		const tableMap: TableMap = {
			seats: 6,
			shape: 'oval',
			dmPosition: 0,
			assignments: [{ seatIndex: 1, characterId: 'char-1' }]
		};

		render(TableVisualization, {
			props: {
				tableMap,
				characters: mockCharacters,
				onSeatClick
			}
		});

		const assignedSeat = screen.getByRole('button', { name: /seat 1/i });
		await fireEvent.click(assignedSeat);

		expect(onSeatClick).toHaveBeenCalledWith(1);
	});
});

describe('TableVisualization Component - Readonly Mode', () => {
	it('should not call onSeatClick when readonly is true', async () => {
		const onSeatClick = vi.fn();
		const tableMap: TableMap = {
			seats: 6,
			shape: 'oval',
			dmPosition: 0,
			assignments: []
		};

		render(TableVisualization, {
			props: {
				tableMap,
				characters: [],
				onSeatClick,
				readonly: true
			}
		});

		const seat1 = screen.getByRole('button', { name: /seat 1/i });
		await fireEvent.click(seat1);

		expect(onSeatClick).not.toHaveBeenCalled();
	});

	it('should visually indicate readonly mode with disabled attribute', () => {
		const tableMap: TableMap = {
			seats: 6,
			shape: 'oval',
			dmPosition: 0,
			assignments: []
		};

		render(TableVisualization, {
			props: {
				tableMap,
				characters: [],
				onSeatClick: vi.fn(),
				readonly: true
			}
		});

		const seat1 = screen.getByRole('button', { name: /seat 1/i });
		// Should have disabled attribute
		expect(seat1).toHaveAttribute('disabled');
	});
});

describe('TableVisualization Component - Accessibility', () => {
	it('should have proper ARIA labels for seats', () => {
		const tableMap: TableMap = {
			seats: 6,
			shape: 'oval',
			dmPosition: 0,
			assignments: []
		};

		render(TableVisualization, {
			props: {
				tableMap,
				characters: [],
				onSeatClick: vi.fn()
			}
		});

		const seat1 = screen.getByRole('button', { name: /seat 1/i });
		expect(seat1).toHaveAttribute('aria-label');
	});

	it('should have descriptive ARIA label for DM seat', () => {
		const tableMap: TableMap = {
			seats: 6,
			shape: 'oval',
			dmPosition: 0,
			assignments: []
		};

		render(TableVisualization, {
			props: {
				tableMap,
				characters: [],
				onSeatClick: vi.fn()
			}
		});

		const dmSeat = screen.getByRole('button', { name: /seat 0/i });
		const ariaLabel = dmSeat.getAttribute('aria-label');
		expect(ariaLabel).toMatch(/DM/i);
	});

	it('should support keyboard navigation', () => {
		const tableMap: TableMap = {
			seats: 6,
			shape: 'oval',
			dmPosition: 0,
			assignments: []
		};

		render(TableVisualization, {
			props: {
				tableMap,
				characters: [],
				onSeatClick: vi.fn()
			}
		});

		const seat1 = screen.getByRole('button', { name: /seat 1/i });
		seat1.focus();
		expect(document.activeElement).toBe(seat1);
	});
});
