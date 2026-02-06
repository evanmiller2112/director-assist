/**
 * Tests for SeatAssignmentModal Component (GitHub Issue #318)
 *
 * RED Phase (TDD): These tests define the expected behavior for the seat
 * assignment modal component. Tests will FAIL until the component is implemented.
 *
 * Component: Modal for assigning players and characters to a specific seat
 *
 * Features:
 * - Shows/hides based on open prop
 * - Displays seat number/position
 * - Dropdown for selecting player
 * - Dropdown for selecting character
 * - Clear button to remove assignments
 * - Save button that calls onSave with selected values
 * - Cancel button that calls onClose
 * - Validates that at least one assignment exists before saving
 *
 * Props:
 * - open: boolean - Whether modal is visible
 * - seatIndex: number - Which seat is being edited
 * - currentAssignment?: SeatAssignment - Existing assignment (if any)
 * - players: BaseEntity[] - Available players
 * - characters: BaseEntity[] - Available characters
 * - onSave: (playerId?: string, characterId?: string) => void
 * - onClose: () => void
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import type { BaseEntity } from '$lib/types';
import type { SeatAssignment } from '$lib/types/campaign';
import SeatAssignmentModal from './SeatAssignmentModal.svelte';

describe('SeatAssignmentModal Component - Visibility', () => {
	const mockPlayers: BaseEntity[] = [
		{
			id: 'player-1',
			type: 'player_profile',
			name: 'Alice',
			description: '',
			tags: [],
			fields: {},
			links: [],
			notes: '',
			createdAt: new Date(),
			updatedAt: new Date()
		}
	];

	const mockCharacters: BaseEntity[] = [
		{
			id: 'char-1',
			type: 'character',
			name: 'Gandalf',
			description: '',
			tags: [],
			fields: {},
			links: [],
			notes: '',
			createdAt: new Date(),
			updatedAt: new Date()
		}
	];

	it('should show modal when open is true', async () => {
		
			render(SeatAssignmentModal, {
				props: {
					open: true,
					seatIndex: 1,
					players: mockPlayers,
					characters: mockCharacters,
					onSave: vi.fn(),
					onClose: vi.fn()
				}
			});

			const modal = screen.getByRole('dialog');
			expect(modal).toBeInTheDocument();
		
	});

	it('should hide modal when open is false', () => {
		
			render(SeatAssignmentModal, {
				props: {
					open: false,
					seatIndex: 1,
					players: mockPlayers,
					characters: mockCharacters,
					onSave: vi.fn(),
					onClose: vi.fn()
				}
			});

			const modal = screen.queryByRole('dialog');
			expect(modal).not.toBeInTheDocument();
		
	});

	it('should display seat number in modal title', () => {
		
			render(SeatAssignmentModal, {
				props: {
					open: true,
					seatIndex: 3,
					players: mockPlayers,
					characters: mockCharacters,
					onSave: vi.fn(),
					onClose: vi.fn()
				}
			});

			expect(screen.getByText(/seat 3/i)).toBeInTheDocument();
		
	});
});

describe('SeatAssignmentModal Component - Player Dropdown', () => {
	const mockPlayers: BaseEntity[] = [
		{
			id: 'player-1',
			type: 'player_profile',
			name: 'Alice',
			description: '',
			tags: [],
			fields: {},
			links: [],
			notes: '',
			createdAt: new Date(),
			updatedAt: new Date()
		},
		{
			id: 'player-2',
			type: 'player_profile',
			name: 'Bob',
			description: '',
			tags: [],
			fields: {},
			links: [],
			notes: '',
			createdAt: new Date(),
			updatedAt: new Date()
		},
		{
			id: 'player-3',
			type: 'player_profile',
			name: 'Charlie',
			description: '',
			tags: [],
			fields: {},
			links: [],
			notes: '',
			createdAt: new Date(),
			updatedAt: new Date()
		}
	];

	it('should display player dropdown', () => {
		
			render(SeatAssignmentModal, {
				props: {
					open: true,
					seatIndex: 1,
					players: mockPlayers,
					characters: [],
					onSave: vi.fn(),
					onClose: vi.fn()
				}
			});

			const playerDropdown = screen.getByLabelText(/player/i);
			expect(playerDropdown).toBeInTheDocument();
		
	});

	it('should show all available players in dropdown', () => {
		
			render(SeatAssignmentModal, {
				props: {
					open: true,
					seatIndex: 1,
					players: mockPlayers,
					characters: [],
					onSave: vi.fn(),
					onClose: vi.fn()
				}
			});

			const playerDropdown = screen.getByLabelText(/player/i);
			const options = Array.from(playerDropdown.querySelectorAll('option'));
			const optionTexts = options.map(opt => opt.textContent);

			expect(optionTexts).toContain('Alice');
			expect(optionTexts).toContain('Bob');
			expect(optionTexts).toContain('Charlie');
		
	});

	it('should have "None" or empty option in player dropdown', () => {
		
			render(SeatAssignmentModal, {
				props: {
					open: true,
					seatIndex: 1,
					players: mockPlayers,
					characters: [],
					onSave: vi.fn(),
					onClose: vi.fn()
				}
			});

			const playerDropdown = screen.getByLabelText(/player/i);
			const options = Array.from(playerDropdown.querySelectorAll('option'));
			const optionTexts = options.map(opt => opt.textContent);

			expect(optionTexts).toContain(/none|select/i);
		
	});

	it('should pre-select player if currentAssignment has playerId', () => {
		const currentAssignment: SeatAssignment = {
			seatIndex: 1,
			playerId: 'player-2'
		};

		
			render(SeatAssignmentModal, {
				props: {
					open: true,
					seatIndex: 1,
					currentAssignment,
					players: mockPlayers,
					characters: [],
					onSave: vi.fn(),
					onClose: vi.fn()
				}
			});

			const playerDropdown = screen.getByLabelText(/player/i) as HTMLSelectElement;
			expect(playerDropdown.value).toBe('player-2');
		
	});

	it('should allow changing player selection', () => {
		
			render(SeatAssignmentModal, {
				props: {
					open: true,
					seatIndex: 1,
					players: mockPlayers,
					characters: [],
					onSave: vi.fn(),
					onClose: vi.fn()
				}
			});

			const playerDropdown = screen.getByLabelText(/player/i) as HTMLSelectElement;
			await fireEvent.change(playerDropdown, { target: { value: 'player-1' } });

			expect(playerDropdown.value).toBe('player-1');
		
	});

	it('should show empty state message when no players available', async () => {
		
			render(SeatAssignmentModal, {
				props: {
					open: true,
					seatIndex: 1,
					players: [],
					characters: [],
					onSave: vi.fn(),
					onClose: vi.fn()
				}
			});

			expect(screen.getByText(/no players available/i)).toBeInTheDocument();
		
	});
});

describe('SeatAssignmentModal Component - Character Dropdown', () => {
	const mockCharacters: BaseEntity[] = [
		{
			id: 'char-1',
			type: 'character',
			name: 'Gandalf',
			description: '',
			tags: [],
			fields: {},
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
			fields: {},
			links: [],
			notes: '',
			createdAt: new Date(),
			updatedAt: new Date()
		},
		{
			id: 'char-3',
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

	it('should display character dropdown', () => {
		
			render(SeatAssignmentModal, {
				props: {
					open: true,
					seatIndex: 1,
					players: [],
					characters: mockCharacters,
					onSave: vi.fn(),
					onClose: vi.fn()
				}
			});

			const characterDropdown = screen.getByLabelText(/character/i);
			expect(characterDropdown).toBeInTheDocument();
		
	});

	it('should show all available characters in dropdown', () => {
		
			render(SeatAssignmentModal, {
				props: {
					open: true,
					seatIndex: 1,
					players: [],
					characters: mockCharacters,
					onSave: vi.fn(),
					onClose: vi.fn()
				}
			});

			const characterDropdown = screen.getByLabelText(/character/i);
			const options = Array.from(characterDropdown.querySelectorAll('option'));
			const optionTexts = options.map(opt => opt.textContent);

			expect(optionTexts).toContain('Gandalf');
			expect(optionTexts).toContain('Aragorn');
			expect(optionTexts).toContain('Legolas');
		
	});

	it('should have "None" or empty option in character dropdown', () => {
		
			render(SeatAssignmentModal, {
				props: {
					open: true,
					seatIndex: 1,
					players: [],
					characters: mockCharacters,
					onSave: vi.fn(),
					onClose: vi.fn()
				}
			});

			const characterDropdown = screen.getByLabelText(/character/i);
			const options = Array.from(characterDropdown.querySelectorAll('option'));
			const optionTexts = options.map(opt => opt.textContent);

			expect(optionTexts).toContain(/none|select/i);
		
	});

	it('should pre-select character if currentAssignment has characterId', () => {
		const currentAssignment: SeatAssignment = {
			seatIndex: 1,
			characterId: 'char-2'
		};

		
			render(SeatAssignmentModal, {
				props: {
					open: true,
					seatIndex: 1,
					currentAssignment,
					players: [],
					characters: mockCharacters,
					onSave: vi.fn(),
					onClose: vi.fn()
				}
			});

			const characterDropdown = screen.getByLabelText(/character/i) as HTMLSelectElement;
			expect(characterDropdown.value).toBe('char-2');
		
	});

	it('should allow changing character selection', () => {
		
			render(SeatAssignmentModal, {
				props: {
					open: true,
					seatIndex: 1,
					players: [],
					characters: mockCharacters,
					onSave: vi.fn(),
					onClose: vi.fn()
				}
			});

			const characterDropdown = screen.getByLabelText(/character/i) as HTMLSelectElement;
			await fireEvent.change(characterDropdown, { target: { value: 'char-3' } });

			expect(characterDropdown.value).toBe('char-3');
		
	});

	it('should show empty state message when no characters available', async () => {
		
			render(SeatAssignmentModal, {
				props: {
					open: true,
					seatIndex: 1,
					players: [],
					characters: [],
					onSave: vi.fn(),
					onClose: vi.fn()
				}
			});

			expect(screen.getByText(/no characters available/i)).toBeInTheDocument();
		
	});
});

describe('SeatAssignmentModal Component - Save Functionality', () => {
	const mockPlayers: BaseEntity[] = [
		{
			id: 'player-1',
			type: 'player_profile',
			name: 'Alice',
			description: '',
			tags: [],
			fields: {},
			links: [],
			notes: '',
			createdAt: new Date(),
			updatedAt: new Date()
		}
	];

	const mockCharacters: BaseEntity[] = [
		{
			id: 'char-1',
			type: 'character',
			name: 'Gandalf',
			description: '',
			tags: [],
			fields: {},
			links: [],
			notes: '',
			createdAt: new Date(),
			updatedAt: new Date()
		}
	];

	it('should call onSave with selected player when Save clicked', () => {
		const onSave = vi.fn();

		
			render(SeatAssignmentModal, {
				props: {
					open: true,
					seatIndex: 1,
					players: mockPlayers,
					characters: [],
					onSave,
					onClose: vi.fn()
				}
			});

			const playerDropdown = screen.getByLabelText(/player/i);
			await fireEvent.change(playerDropdown, { target: { value: 'player-1' } });

			const saveButton = screen.getByRole('button', { name: /save/i });
			await fireEvent.click(saveButton);

			expect(onSave).toHaveBeenCalledWith('player-1', undefined);
		
	});

	it('should call onSave with selected character when Save clicked', async () => {
		const onSave = vi.fn();

		
			render(SeatAssignmentModal, {
				props: {
					open: true,
					seatIndex: 1,
					players: [],
					characters: mockCharacters,
					onSave,
					onClose: vi.fn()
				}
			});

			const characterDropdown = screen.getByLabelText(/character/i);
			await fireEvent.change(characterDropdown, { target: { value: 'char-1' } });

			const saveButton = screen.getByRole('button', { name: /save/i });
			await fireEvent.click(saveButton);

			expect(onSave).toHaveBeenCalledWith(undefined, 'char-1');
		
	});

	it('should call onSave with both player and character when both selected', async () => {
		const onSave = vi.fn();

		
			render(SeatAssignmentModal, {
				props: {
					open: true,
					seatIndex: 1,
					players: mockPlayers,
					characters: mockCharacters,
					onSave,
					onClose: vi.fn()
				}
			});

			const playerDropdown = screen.getByLabelText(/player/i);
			await fireEvent.change(playerDropdown, { target: { value: 'player-1' } });

			const characterDropdown = screen.getByLabelText(/character/i);
			await fireEvent.change(characterDropdown, { target: { value: 'char-1' } });

			const saveButton = screen.getByRole('button', { name: /save/i });
			await fireEvent.click(saveButton);

			expect(onSave).toHaveBeenCalledWith('player-1', 'char-1');
		
	});

	it('should call onSave with undefined values when Clear clicked', async () => {
		const onSave = vi.fn();
		const currentAssignment: SeatAssignment = {
			seatIndex: 1,
			playerId: 'player-1',
			characterId: 'char-1'
		};

		
			render(SeatAssignmentModal, {
				props: {
					open: true,
					seatIndex: 1,
					currentAssignment,
					players: mockPlayers,
					characters: mockCharacters,
					onSave,
					onClose: vi.fn()
				}
			});

			const clearButton = screen.getByRole('button', { name: /clear/i });
			await fireEvent.click(clearButton);

			expect(onSave).toHaveBeenCalledWith(undefined, undefined);
		
	});

	it('should close modal after successful save', async () => {
		const onSave = vi.fn();
		const onClose = vi.fn();

		
			render(SeatAssignmentModal, {
				props: {
					open: true,
					seatIndex: 1,
					players: mockPlayers,
					characters: [],
					onSave,
					onClose
				}
			});

			const playerDropdown = screen.getByLabelText(/player/i);
			await fireEvent.change(playerDropdown, { target: { value: 'player-1' } });

			const saveButton = screen.getByRole('button', { name: /save/i });
			await fireEvent.click(saveButton);

			await waitFor(() => {
				expect(onClose).toHaveBeenCalled();
			});
		
	});
});

describe('SeatAssignmentModal Component - Cancel Functionality', () => {
	it('should call onClose when Cancel clicked', async () => {
		const onClose = vi.fn();

		
			render(SeatAssignmentModal, {
				props: {
					open: true,
					seatIndex: 1,
					players: [],
					characters: [],
					onSave: vi.fn(),
					onClose
				}
			});

			const cancelButton = screen.getByRole('button', { name: /cancel/i });
			await fireEvent.click(cancelButton);

			expect(onClose).toHaveBeenCalled();
		
	});

	it('should call onClose when X button clicked', async () => {
		const onClose = vi.fn();

		
			render(SeatAssignmentModal, {
				props: {
					open: true,
					seatIndex: 1,
					players: [],
					characters: [],
					onSave: vi.fn(),
					onClose
				}
			});

			const closeButton = screen.getByRole('button', { name: /close/i });
			await fireEvent.click(closeButton);

			expect(onClose).toHaveBeenCalled();
		
	});

	it('should call onClose when backdrop clicked', async () => {
		const onClose = vi.fn();

		
			render(SeatAssignmentModal, {
				props: {
					open: true,
					seatIndex: 1,
					players: [],
					characters: [],
					onSave: vi.fn(),
					onClose
				}
			});

			const backdrop = screen.getByRole('dialog').parentElement;
			await fireEvent.click(backdrop!);

			expect(onClose).toHaveBeenCalled();
		
	});

	it('should not call onSave when modal is cancelled', async () => {
		const onSave = vi.fn();

		
			render(SeatAssignmentModal, {
				props: {
					open: true,
					seatIndex: 1,
					players: [],
					characters: [],
					onSave,
					onClose: vi.fn()
				}
			});

			const cancelButton = screen.getByRole('button', { name: /cancel/i });
			await fireEvent.click(cancelButton);

			expect(onSave).not.toHaveBeenCalled();
		
	});
});

describe('SeatAssignmentModal Component - Clear Button', () => {
	const mockPlayers: BaseEntity[] = [
		{
			id: 'player-1',
			type: 'player_profile',
			name: 'Alice',
			description: '',
			tags: [],
			fields: {},
			links: [],
			notes: '',
			createdAt: new Date(),
			updatedAt: new Date()
		}
	];

	it('should show Clear button', async () => {
		
			render(SeatAssignmentModal, {
				props: {
					open: true,
					seatIndex: 1,
					players: mockPlayers,
					characters: [],
					onSave: vi.fn(),
					onClose: vi.fn()
				}
			});

			const clearButton = screen.getByRole('button', { name: /clear/i });
			expect(clearButton).toBeInTheDocument();
		
	});

	it('should disable Clear button when no assignment exists', () => {
		
			render(SeatAssignmentModal, {
				props: {
					open: true,
					seatIndex: 1,
					players: mockPlayers,
					characters: [],
					onSave: vi.fn(),
					onClose: vi.fn()
				}
			});

			const clearButton = screen.getByRole('button', { name: /clear/i });
			expect(clearButton).toBeDisabled();
		
	});

	it('should enable Clear button when assignment exists', () => {
		const currentAssignment: SeatAssignment = {
			seatIndex: 1,
			playerId: 'player-1'
		};

		
			render(SeatAssignmentModal, {
				props: {
					open: true,
					seatIndex: 1,
					currentAssignment,
					players: mockPlayers,
					characters: [],
					onSave: vi.fn(),
					onClose: vi.fn()
				}
			});

			const clearButton = screen.getByRole('button', { name: /clear/i });
			expect(clearButton).not.toBeDisabled();
		
	});

	it('should reset dropdowns when Clear is clicked', () => {
		const currentAssignment: SeatAssignment = {
			seatIndex: 1,
			playerId: 'player-1'
		};

		
			render(SeatAssignmentModal, {
				props: {
					open: true,
					seatIndex: 1,
					currentAssignment,
					players: mockPlayers,
					characters: [],
					onSave: vi.fn(),
					onClose: vi.fn()
				}
			});

			const clearButton = screen.getByRole('button', { name: /clear/i });
			await fireEvent.click(clearButton);

			const playerDropdown = screen.getByLabelText(/player/i) as HTMLSelectElement;
			expect(playerDropdown.value).toBe('');
		
	});
});

describe('SeatAssignmentModal Component - Form Buttons', () => {
	it('should render Save button', async () => {
		
			render(SeatAssignmentModal, {
				props: {
					open: true,
					seatIndex: 1,
					players: [],
					characters: [],
					onSave: vi.fn(),
					onClose: vi.fn()
				}
			});

			const saveButton = screen.getByRole('button', { name: /save/i });
			expect(saveButton).toBeInTheDocument();
		
	});

	it('should render Cancel button', () => {
		
			render(SeatAssignmentModal, {
				props: {
					open: true,
					seatIndex: 1,
					players: [],
					characters: [],
					onSave: vi.fn(),
					onClose: vi.fn()
				}
			});

			const cancelButton = screen.getByRole('button', { name: /cancel/i });
			expect(cancelButton).toBeInTheDocument();
		
	});

	it('should render Clear button', () => {
		
			render(SeatAssignmentModal, {
				props: {
					open: true,
					seatIndex: 1,
					players: [],
					characters: [],
					onSave: vi.fn(),
					onClose: vi.fn()
				}
			});

			const clearButton = screen.getByRole('button', { name: /clear/i });
			expect(clearButton).toBeInTheDocument();
		
	});
});

describe('SeatAssignmentModal Component - Accessibility', () => {
	it('should have proper modal ARIA attributes', () => {
		
			render(SeatAssignmentModal, {
				props: {
					open: true,
					seatIndex: 1,
					players: [],
					characters: [],
					onSave: vi.fn(),
					onClose: vi.fn()
				}
			});

			const modal = screen.getByRole('dialog');
			expect(modal).toHaveAttribute('aria-modal', 'true');
			expect(modal).toHaveAttribute('aria-labelledby');
		
	});

	it('should have proper labels for all form inputs', () => {
		const mockPlayers: BaseEntity[] = [
			{
				id: 'player-1',
				type: 'player_profile',
				name: 'Alice',
				description: '',
				tags: [],
				fields: {},
				links: [],
				notes: '',
				createdAt: new Date(),
				updatedAt: new Date()
			}
		];

		const mockCharacters: BaseEntity[] = [
			{
				id: 'char-1',
				type: 'character',
				name: 'Gandalf',
				description: '',
				tags: [],
				fields: {},
				links: [],
				notes: '',
				createdAt: new Date(),
				updatedAt: new Date()
			}
		];

		
			render(SeatAssignmentModal, {
				props: {
					open: true,
					seatIndex: 1,
					players: mockPlayers,
					characters: mockCharacters,
					onSave: vi.fn(),
					onClose: vi.fn()
				}
			});

			expect(screen.getByLabelText(/player/i)).toBeInTheDocument();
			expect(screen.getByLabelText(/character/i)).toBeInTheDocument();
		
	});

	it('should support keyboard navigation', () => {
		
			render(SeatAssignmentModal, {
				props: {
					open: true,
					seatIndex: 1,
					players: [],
					characters: [],
					onSave: vi.fn(),
					onClose: vi.fn()
				}
			});

			const saveButton = screen.getByRole('button', { name: /save/i });
			saveButton.focus();
			expect(document.activeElement).toBe(saveButton);
		
	});

	it('should close on Escape key', () => {
		const onClose = vi.fn();

		
			render(SeatAssignmentModal, {
				props: {
					open: true,
					seatIndex: 1,
					players: [],
					characters: [],
					onSave: vi.fn(),
					onClose
				}
			});

			const modal = screen.getByRole('dialog');
			await fireEvent.keyDown(modal, { key: 'Escape' });

			expect(onClose).toHaveBeenCalled();
		
	});
});

describe('SeatAssignmentModal Component - Edge Cases', () => {
	it('should handle seatIndex 0 (DM position)', () => {
		
			render(SeatAssignmentModal, {
				props: {
					open: true,
					seatIndex: 0,
					players: [],
					characters: [],
					onSave: vi.fn(),
					onClose: vi.fn()
				}
			});

			expect(screen.getByText(/seat 0/i)).toBeInTheDocument();
		
	});

	it('should handle high seat index (9)', () => {
		
			render(SeatAssignmentModal, {
				props: {
					open: true,
					seatIndex: 9,
					players: [],
					characters: [],
					onSave: vi.fn(),
					onClose: vi.fn()
				}
			});

			expect(screen.getByText(/seat 9/i)).toBeInTheDocument();
		
	});

	it('should handle empty players and characters arrays', () => {
		
			render(SeatAssignmentModal, {
				props: {
					open: true,
					seatIndex: 1,
					players: [],
					characters: [],
					onSave: vi.fn(),
					onClose: vi.fn()
				}
			});

			expect(screen.getByText(/no players available/i)).toBeInTheDocument();
			expect(screen.getByText(/no characters available/i)).toBeInTheDocument();
		
	});

	it('should handle assignment with player but no character', () => {
		const mockPlayers: BaseEntity[] = [
			{
				id: 'player-1',
				type: 'player_profile',
				name: 'Alice',
				description: '',
				tags: [],
				fields: {},
				links: [],
				notes: '',
				createdAt: new Date(),
				updatedAt: new Date()
			}
		];

		const currentAssignment: SeatAssignment = {
			seatIndex: 1,
			playerId: 'player-1'
		};

		
			render(SeatAssignmentModal, {
				props: {
					open: true,
					seatIndex: 1,
					currentAssignment,
					players: mockPlayers,
					characters: [],
					onSave: vi.fn(),
					onClose: vi.fn()
				}
			});

			const playerDropdown = screen.getByLabelText(/player/i) as HTMLSelectElement;
			expect(playerDropdown.value).toBe('player-1');
		
	});

	it('should handle assignment with character but no player', () => {
		const mockCharacters: BaseEntity[] = [
			{
				id: 'char-1',
				type: 'character',
				name: 'Gandalf',
				description: '',
				tags: [],
				fields: {},
				links: [],
				notes: '',
				createdAt: new Date(),
				updatedAt: new Date()
			}
		];

		const currentAssignment: SeatAssignment = {
			seatIndex: 1,
			characterId: 'char-1'
		};

		
			render(SeatAssignmentModal, {
				props: {
					open: true,
					seatIndex: 1,
					currentAssignment,
					players: [],
					characters: mockCharacters,
					onSave: vi.fn(),
					onClose: vi.fn()
				}
			});

			const characterDropdown = screen.getByLabelText(/character/i) as HTMLSelectElement;
			expect(characterDropdown.value).toBe('char-1');
		
	});
});

