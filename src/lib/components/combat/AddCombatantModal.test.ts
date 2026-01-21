/**
 * Tests for AddCombatantModal Component
 *
 * TDD RED PHASE - Tests for A2 Combat Round Tracker - Add Combatant Modal
 *
 * This modal allows adding new combatants to an active combat session:
 * - Toggle between Hero and Creature types
 * - Search and select from existing entities
 * - Enter HP, AC, initiative
 * - For heroes: add heroic resource values
 * - For creatures: select threat level
 *
 * These tests will FAIL until the component is implemented in the GREEN phase.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/svelte';
import AddCombatantModal from './AddCombatantModal.svelte';
import { createMockEntity } from '../../../tests/utils/testUtils';
import type { BaseEntity } from '$lib/types';

// Mock entities store
let mockEntities: BaseEntity[] = [];
const mockEntitiesStore = {
	subscribe: vi.fn(),
	getAll: vi.fn(() => mockEntities),
	getByType: vi.fn((type: string) => mockEntities.filter(e => e.type === type))
};

vi.mock('$lib/stores', () => ({
	entitiesStore: mockEntitiesStore
}));

describe('AddCombatantModal - Modal Visibility', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockEntities = [];
	});

	it('should not be visible when open prop is false', () => {
		render(AddCombatantModal, { props: { open: false } });

		expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
	});

	it('should be visible when open prop is true', () => {
		render(AddCombatantModal, { props: { open: true } });

		expect(screen.getByRole('dialog')).toBeInTheDocument();
	});

	it('should have appropriate modal title', () => {
		render(AddCombatantModal, { props: { open: true } });

		expect(screen.getByRole('heading', { name: /add.*combatant/i })).toBeInTheDocument();
	});

	it('should have dialog role for accessibility', () => {
		render(AddCombatantModal, { props: { open: true } });

		const dialog = screen.getByRole('dialog');
		expect(dialog).toHaveAttribute('aria-modal', 'true');
	});
});

describe('AddCombatantModal - Type Toggle', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockEntities = [];
	});

	it('should display Hero/Creature type toggle', () => {
		render(AddCombatantModal, { props: { open: true } });

		expect(screen.getByRole('button', { name: /hero/i })).toBeInTheDocument();
		expect(screen.getByRole('button', { name: /creature/i })).toBeInTheDocument();
	});

	it('should default to Hero type selected', () => {
		render(AddCombatantModal, { props: { open: true } });

		const heroButton = screen.getByRole('button', { name: /hero/i });
		expect(heroButton).toHaveClass(/active|selected/);
	});

	it('should switch to Creature type when Creature button is clicked', async () => {
		render(AddCombatantModal, { props: { open: true } });

		const creatureButton = screen.getByRole('button', { name: /creature/i });
		await fireEvent.click(creatureButton);

		expect(creatureButton).toHaveClass(/active|selected/);
	});

	it('should switch back to Hero type when Hero button is clicked', async () => {
		render(AddCombatantModal, { props: { open: true } });

		const creatureButton = screen.getByRole('button', { name: /creature/i });
		const heroButton = screen.getByRole('button', { name: /hero/i });

		await fireEvent.click(creatureButton);
		await fireEvent.click(heroButton);

		expect(heroButton).toHaveClass(/active|selected/);
	});
});

describe('AddCombatantModal - Entity Selection', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockEntities = [
			createMockEntity({ id: 'char-1', name: 'Thorin', type: 'character' }),
			createMockEntity({ id: 'char-2', name: 'Gandalf', type: 'character' }),
			createMockEntity({ id: 'npc-1', name: 'Goblin King', type: 'npc' }),
			createMockEntity({ id: 'npc-2', name: 'Dragon', type: 'npc' })
		];
	});

	it('should have entity search input', () => {
		render(AddCombatantModal, { props: { open: true } });

		expect(screen.getByRole('textbox', { name: /search.*entity/i })).toBeInTheDocument();
	});

	it('should display character entities when Hero type is selected', () => {
		render(AddCombatantModal, { props: { open: true } });

		// Hero type should show characters
		expect(screen.getByText('Thorin')).toBeInTheDocument();
		expect(screen.getByText('Gandalf')).toBeInTheDocument();
	});

	it('should display NPC entities when Creature type is selected', async () => {
		render(AddCombatantModal, { props: { open: true } });

		const creatureButton = screen.getByRole('button', { name: /creature/i });
		await fireEvent.click(creatureButton);

		// Creature type should show NPCs
		await waitFor(() => {
			expect(screen.getByText('Goblin King')).toBeInTheDocument();
			expect(screen.getByText('Dragon')).toBeInTheDocument();
		});
	});

	it('should filter entities based on search input', async () => {
		render(AddCombatantModal, { props: { open: true } });

		const searchInput = screen.getByRole('textbox', { name: /search.*entity/i });
		await fireEvent.input(searchInput, { target: { value: 'Thorin' } });

		await waitFor(() => {
			expect(screen.getByText('Thorin')).toBeInTheDocument();
			expect(screen.queryByText('Gandalf')).not.toBeInTheDocument();
		});
	});

	it('should allow selecting an entity', async () => {
		render(AddCombatantModal, { props: { open: true } });

		const entityButton = screen.getByText('Thorin').closest('button');
		await fireEvent.click(entityButton!);

		// Entity should be visually selected
		expect(entityButton).toHaveClass(/selected|active/);
	});

	it('should show "No entities found" when search has no results', async () => {
		render(AddCombatantModal, { props: { open: true } });

		const searchInput = screen.getByRole('textbox', { name: /search.*entity/i });
		await fireEvent.input(searchInput, { target: { value: 'NotFoundEntity' } });

		await waitFor(() => {
			expect(screen.getByText(/no.*entities.*found/i)).toBeInTheDocument();
		});
	});

	it('should show "No entities" message when no entities of type exist', () => {
		mockEntities = [];
		render(AddCombatantModal, { props: { open: true } });

		expect(screen.getByText(/no.*entities/i)).toBeInTheDocument();
	});
});

describe('AddCombatantModal - Common Fields', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockEntities = [
			createMockEntity({ id: 'char-1', name: 'Hero', type: 'character' })
		];
	});

	it('should have HP input field', () => {
		render(AddCombatantModal, { props: { open: true } });

		expect(screen.getByLabelText(/hp|hit points/i)).toBeInTheDocument();
	});

	it('should have Max HP input field', () => {
		render(AddCombatantModal, { props: { open: true } });

		expect(screen.getByLabelText(/max.*hp/i)).toBeInTheDocument();
	});

	it('should have AC input field', () => {
		render(AddCombatantModal, { props: { open: true } });

		expect(screen.getByLabelText(/ac|armor class/i)).toBeInTheDocument();
	});

	it('should have Initiative input field', () => {
		render(AddCombatantModal, { props: { open: true } });

		expect(screen.getByLabelText(/initiative/i)).toBeInTheDocument();
	});

	it('should accept numeric input for HP', async () => {
		render(AddCombatantModal, { props: { open: true } });

		const hpInput = screen.getByLabelText(/^hp|hit points/i) as HTMLInputElement;
		await fireEvent.input(hpInput, { target: { value: '25' } });

		expect(hpInput.value).toBe('25');
	});

	it('should accept numeric input for Max HP', async () => {
		render(AddCombatantModal, { props: { open: true } });

		const maxHpInput = screen.getByLabelText(/max.*hp/i) as HTMLInputElement;
		await fireEvent.input(maxHpInput, { target: { value: '40' } });

		expect(maxHpInput.value).toBe('40');
	});

	it('should accept numeric input for AC', async () => {
		render(AddCombatantModal, { props: { open: true } });

		const acInput = screen.getByLabelText(/ac|armor class/i) as HTMLInputElement;
		await fireEvent.input(acInput, { target: { value: '16' } });

		expect(acInput.value).toBe('16');
	});
});

describe('AddCombatantModal - Hero-Specific Fields', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockEntities = [
			createMockEntity({ id: 'char-1', name: 'Hero', type: 'character' })
		];
	});

	it('should show heroic resource fields when Hero type is selected', () => {
		render(AddCombatantModal, { props: { open: true } });

		expect(screen.getByLabelText(/resource.*name/i)).toBeInTheDocument();
	});

	it('should have heroic resource name input', () => {
		render(AddCombatantModal, { props: { open: true } });

		const resourceNameInput = screen.getByLabelText(/resource.*name/i);
		expect(resourceNameInput).toBeInTheDocument();
	});

	it('should have heroic resource current value input', () => {
		render(AddCombatantModal, { props: { open: true } });

		expect(screen.getByLabelText(/current|resource.*current/i)).toBeInTheDocument();
	});

	it('should have heroic resource max value input', () => {
		render(AddCombatantModal, { props: { open: true } });

		expect(screen.getByLabelText(/max|resource.*max/i)).toBeInTheDocument();
	});

	it('should accept text input for resource name', async () => {
		render(AddCombatantModal, { props: { open: true } });

		const resourceNameInput = screen.getByLabelText(/resource.*name/i) as HTMLInputElement;
		await fireEvent.input(resourceNameInput, { target: { value: 'Victories' } });

		expect(resourceNameInput.value).toBe('Victories');
	});

	it('should have common resource name suggestions', () => {
		render(AddCombatantModal, { props: { open: true } });

		// Should have datalist or dropdown with common names
		const resourceNameInput = screen.getByLabelText(/resource.*name/i);
		expect(resourceNameInput).toHaveAttribute('list', expect.any(String));
	});

	it('should not show heroic resource fields when Creature type is selected', async () => {
		render(AddCombatantModal, { props: { open: true } });

		const creatureButton = screen.getByRole('button', { name: /creature/i });
		await fireEvent.click(creatureButton);

		await waitFor(() => {
			expect(screen.queryByLabelText(/resource.*name/i)).not.toBeInTheDocument();
		});
	});
});

describe('AddCombatantModal - Creature-Specific Fields', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockEntities = [
			createMockEntity({ id: 'npc-1', name: 'Monster', type: 'npc' })
		];
	});

	it('should show threat level field when Creature type is selected', async () => {
		render(AddCombatantModal, { props: { open: true } });

		const creatureButton = screen.getByRole('button', { name: /creature/i });
		await fireEvent.click(creatureButton);

		await waitFor(() => {
			expect(screen.getByLabelText(/threat.*level/i)).toBeInTheDocument();
		});
	});

	it('should have threat level options 1-3', async () => {
		render(AddCombatantModal, { props: { open: true } });

		const creatureButton = screen.getByRole('button', { name: /creature/i });
		await fireEvent.click(creatureButton);

		await waitFor(() => {
			const threatSelect = screen.getByLabelText(/threat.*level/i);
			expect(within(threatSelect as HTMLElement).getByText('1')).toBeInTheDocument();
			expect(within(threatSelect as HTMLElement).getByText('2')).toBeInTheDocument();
			expect(within(threatSelect as HTMLElement).getByText('3')).toBeInTheDocument();
		});
	});

	it('should default to threat level 1', async () => {
		render(AddCombatantModal, { props: { open: true } });

		const creatureButton = screen.getByRole('button', { name: /creature/i });
		await fireEvent.click(creatureButton);

		await waitFor(() => {
			const threatSelect = screen.getByLabelText(/threat.*level/i) as HTMLSelectElement;
			expect(threatSelect.value).toBe('1');
		});
	});

	it('should allow selecting different threat levels', async () => {
		render(AddCombatantModal, { props: { open: true } });

		const creatureButton = screen.getByRole('button', { name: /creature/i });
		await fireEvent.click(creatureButton);

		await waitFor(async () => {
			const threatSelect = screen.getByLabelText(/threat.*level/i) as HTMLSelectElement;
			await fireEvent.change(threatSelect, { target: { value: '3' } });
			expect(threatSelect.value).toBe('3');
		});
	});

	it('should not show threat level field when Hero type is selected', () => {
		render(AddCombatantModal, { props: { open: true } });

		expect(screen.queryByLabelText(/threat.*level/i)).not.toBeInTheDocument();
	});
});

describe('AddCombatantModal - Form Submission', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockEntities = [
			createMockEntity({ id: 'char-1', name: 'Hero', type: 'character' }),
			createMockEntity({ id: 'npc-1', name: 'Monster', type: 'npc' })
		];
	});

	it('should have "Add" button', () => {
		render(AddCombatantModal, { props: { open: true } });

		expect(screen.getByRole('button', { name: /^add$/i })).toBeInTheDocument();
	});

	it('should have "Cancel" button', () => {
		render(AddCombatantModal, { props: { open: true } });

		expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
	});

	it('should disable "Add" button when no entity is selected', () => {
		render(AddCombatantModal, { props: { open: true } });

		const addButton = screen.getByRole('button', { name: /^add$/i });
		expect(addButton).toBeDisabled();
	});

	it('should disable "Add" button when required fields are empty', async () => {
		render(AddCombatantModal, { props: { open: true } });

		// Select entity but don't fill in HP
		const entityButton = screen.getByText('Hero').closest('button');
		await fireEvent.click(entityButton!);

		const addButton = screen.getByRole('button', { name: /^add$/i });
		expect(addButton).toBeDisabled();
	});

	it('should enable "Add" button when all required fields are filled', async () => {
		render(AddCombatantModal, { props: { open: true } });

		// Select entity
		const entityButton = screen.getByText('Hero').closest('button');
		await fireEvent.click(entityButton!);

		// Fill in required fields
		const hpInput = screen.getByLabelText(/^hp/i);
		const maxHpInput = screen.getByLabelText(/max.*hp/i);
		const resourceNameInput = screen.getByLabelText(/resource.*name/i);

		await fireEvent.input(hpInput, { target: { value: '30' } });
		await fireEvent.input(maxHpInput, { target: { value: '40' } });
		await fireEvent.input(resourceNameInput, { target: { value: 'Victories' } });

		await waitFor(() => {
			const addButton = screen.getByRole('button', { name: /^add$/i });
			expect(addButton).not.toBeDisabled();
		});
	});

	it('should call onAdd callback with correct hero data when submitted', async () => {
		const onAdd = vi.fn();
		render(AddCombatantModal, { props: { open: true, onAdd } });

		// Select entity and fill form
		const entityButton = screen.getByText('Hero').closest('button');
		await fireEvent.click(entityButton!);

		await fireEvent.input(screen.getByLabelText(/^hp/i), { target: { value: '30' } });
		await fireEvent.input(screen.getByLabelText(/max.*hp/i), { target: { value: '40' } });
		await fireEvent.input(screen.getByLabelText(/^ac/i), { target: { value: '16' } });
		await fireEvent.input(screen.getByLabelText(/resource.*name/i), { target: { value: 'Victories' } });
		await fireEvent.input(screen.getByLabelText(/current|resource.*current/i), { target: { value: '0' } });
		await fireEvent.input(screen.getByLabelText(/max|resource.*max/i), { target: { value: '3' } });

		const addButton = screen.getByRole('button', { name: /^add$/i });
		await fireEvent.click(addButton);

		expect(onAdd).toHaveBeenCalledWith({
			type: 'hero',
			entityId: 'char-1',
			name: 'Hero',
			hp: 30,
			maxHp: 40,
			ac: 16,
			heroicResource: {
				name: 'Victories',
				current: 0,
				max: 3
			}
		});
	});

	it('should call onAdd callback with correct creature data when submitted', async () => {
		const onAdd = vi.fn();
		render(AddCombatantModal, { props: { open: true, onAdd } });

		// Switch to creature type
		const creatureButton = screen.getByRole('button', { name: /creature/i });
		await fireEvent.click(creatureButton);

		await waitFor(async () => {
			// Select entity and fill form
			const entityButton = screen.getByText('Monster').closest('button');
			await fireEvent.click(entityButton!);

			await fireEvent.input(screen.getByLabelText(/^hp/i), { target: { value: '25' } });
			await fireEvent.input(screen.getByLabelText(/max.*hp/i), { target: { value: '25' } });
			await fireEvent.input(screen.getByLabelText(/^ac/i), { target: { value: '14' } });

			const threatSelect = screen.getByLabelText(/threat.*level/i);
			await fireEvent.change(threatSelect, { target: { value: '2' } });

			const addButton = screen.getByRole('button', { name: /^add$/i });
			await fireEvent.click(addButton);
		});

		expect(onAdd).toHaveBeenCalledWith({
			type: 'creature',
			entityId: 'npc-1',
			name: 'Monster',
			hp: 25,
			maxHp: 25,
			ac: 14,
			threat: 2
		});
	});

	it('should close modal after successful submission', async () => {
		const onAdd = vi.fn();
		const onClose = vi.fn();
		render(AddCombatantModal, { props: { open: true, onAdd, onClose } });

		// Fill and submit form
		const entityButton = screen.getByText('Hero').closest('button');
		await fireEvent.click(entityButton!);

		await fireEvent.input(screen.getByLabelText(/^hp/i), { target: { value: '30' } });
		await fireEvent.input(screen.getByLabelText(/max.*hp/i), { target: { value: '40' } });
		await fireEvent.input(screen.getByLabelText(/resource.*name/i), { target: { value: 'Victories' } });

		const addButton = screen.getByRole('button', { name: /^add$/i });
		await fireEvent.click(addButton);

		await waitFor(() => {
			expect(onClose).toHaveBeenCalled();
		});
	});

	it('should call onClose when Cancel button is clicked', async () => {
		const onClose = vi.fn();
		render(AddCombatantModal, { props: { open: true, onClose } });

		const cancelButton = screen.getByRole('button', { name: /cancel/i });
		await fireEvent.click(cancelButton);

		expect(onClose).toHaveBeenCalled();
	});
});

describe('AddCombatantModal - Form Validation', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockEntities = [
			createMockEntity({ id: 'char-1', name: 'Hero', type: 'character' })
		];
	});

	it('should show error when HP is greater than Max HP', async () => {
		render(AddCombatantModal, { props: { open: true } });

		await fireEvent.input(screen.getByLabelText(/^hp/i), { target: { value: '50' } });
		await fireEvent.input(screen.getByLabelText(/max.*hp/i), { target: { value: '40' } });

		await waitFor(() => {
			expect(screen.getByText(/hp.*cannot.*exceed.*max/i)).toBeInTheDocument();
		});
	});

	it('should show error when HP is negative', async () => {
		render(AddCombatantModal, { props: { open: true } });

		await fireEvent.input(screen.getByLabelText(/^hp/i), { target: { value: '-5' } });

		await waitFor(() => {
			expect(screen.getByText(/hp.*must be.*positive/i)).toBeInTheDocument();
		});
	});

	it('should show error when Max HP is 0 or negative', async () => {
		render(AddCombatantModal, { props: { open: true } });

		await fireEvent.input(screen.getByLabelText(/max.*hp/i), { target: { value: '0' } });

		await waitFor(() => {
			expect(screen.getByText(/max hp.*must be.*greater.*0/i)).toBeInTheDocument();
		});
	});

	it('should show error when heroic resource current exceeds max', async () => {
		render(AddCombatantModal, { props: { open: true } });

		await fireEvent.input(screen.getByLabelText(/current|resource.*current/i), { target: { value: '5' } });
		await fireEvent.input(screen.getByLabelText(/max|resource.*max/i), { target: { value: '3' } });

		await waitFor(() => {
			expect(screen.getByText(/current.*cannot.*exceed.*max/i)).toBeInTheDocument();
		});
	});
});

describe('AddCombatantModal - Accessibility', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockEntities = [
			createMockEntity({ id: 'char-1', name: 'Hero', type: 'character' })
		];
	});

	it('should have proper ARIA attributes on dialog', () => {
		render(AddCombatantModal, { props: { open: true } });

		const dialog = screen.getByRole('dialog');
		expect(dialog).toHaveAttribute('aria-modal', 'true');
	});

	it('should have aria-labelledby connecting title to dialog', () => {
		render(AddCombatantModal, { props: { open: true } });

		const dialog = screen.getByRole('dialog');
		const heading = screen.getByRole('heading', { name: /add.*combatant/i });

		const headingId = heading.getAttribute('id');
		expect(headingId).toBeTruthy();
		expect(dialog).toHaveAttribute('aria-labelledby', headingId);
	});

	it('should have proper labels on all form inputs', () => {
		render(AddCombatantModal, { props: { open: true } });

		expect(screen.getByLabelText(/^hp/i)).toBeInTheDocument();
		expect(screen.getByLabelText(/max.*hp/i)).toBeInTheDocument();
		expect(screen.getByLabelText(/^ac/i)).toBeInTheDocument();
		expect(screen.getByLabelText(/resource.*name/i)).toBeInTheDocument();
	});

	it('should focus search input when modal opens', async () => {
		render(AddCombatantModal, { props: { open: true } });

		const searchInput = screen.getByRole('textbox', { name: /search.*entity/i });

		await waitFor(() => {
			expect(searchInput).toHaveFocus();
		});
	});

	it('should trap focus within modal when open', () => {
		render(AddCombatantModal, { props: { open: true } });

		const dialog = screen.getByRole('dialog');
		const buttons = screen.getAllByRole('button');

		buttons.forEach(button => {
			expect(dialog).toContainElement(button);
		});
	});
});

describe('AddCombatantModal - Edge Cases', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should handle empty entities list', () => {
		mockEntities = [];
		render(AddCombatantModal, { props: { open: true } });

		expect(screen.getByText(/no.*entities/i)).toBeInTheDocument();
	});

	it('should clear form when switching between Hero and Creature', async () => {
		mockEntities = [
			createMockEntity({ id: 'char-1', name: 'Hero', type: 'character' }),
			createMockEntity({ id: 'npc-1', name: 'Monster', type: 'npc' })
		];

		render(AddCombatantModal, { props: { open: true } });

		// Fill in hero form
		await fireEvent.input(screen.getByLabelText(/^hp/i), { target: { value: '30' } });
		await fireEvent.input(screen.getByLabelText(/resource.*name/i), { target: { value: 'Victories' } });

		// Switch to creature
		const creatureButton = screen.getByRole('button', { name: /creature/i });
		await fireEvent.click(creatureButton);

		// HP should be cleared
		await waitFor(() => {
			const hpInput = screen.getByLabelText(/^hp/i) as HTMLInputElement;
			expect(hpInput.value).toBe('');
		});
	});

	it('should reset form when modal is closed and reopened', async () => {
		mockEntities = [
			createMockEntity({ id: 'char-1', name: 'Hero', type: 'character' })
		];

		const onClose = vi.fn();
		const { rerender } = render(AddCombatantModal, { props: { open: true, onClose } });

		// Fill in form
		await fireEvent.input(screen.getByLabelText(/^hp/i), { target: { value: '30' } });

		// Close modal
		rerender({ open: false, onClose });

		// Reopen modal
		rerender({ open: true, onClose });

		// Form should be reset
		const hpInput = screen.getByLabelText(/^hp/i) as HTMLInputElement;
		expect(hpInput.value).toBe('');
	});

	it('should handle very long entity names', () => {
		mockEntities = [
			createMockEntity({
				id: 'char-1',
				name: 'This Is A Very Long Entity Name That Should Truncate Or Wrap',
				type: 'character'
			})
		];

		render(AddCombatantModal, { props: { open: true } });

		expect(screen.getByText(/This Is A Very Long/)).toBeInTheDocument();
	});
});

describe('AddCombatantModal - Quick-Add Mode (Issue #233)', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockEntities = [
			createMockEntity({ id: 'char-1', name: 'Hero', type: 'character' }),
			createMockEntity({ id: 'npc-1', name: 'Monster', type: 'npc' })
		];
	});

	describe('Mode Toggle', () => {
		it('should have Quick Add button', () => {
			render(AddCombatantModal, { props: { open: true } });

			expect(screen.getByRole('button', { name: /quick.*add/i })).toBeInTheDocument();
		});

		it('should have From Entity button', () => {
			render(AddCombatantModal, { props: { open: true } });

			expect(screen.getByRole('button', { name: /from.*entity/i })).toBeInTheDocument();
		});

		it('should default to From Entity mode', () => {
			render(AddCombatantModal, { props: { open: true } });

			const fromEntityButton = screen.getByRole('button', { name: /from.*entity/i });
			expect(fromEntityButton).toHaveClass(/active|selected/);

			// Entity search should be visible in From Entity mode
			expect(screen.getByRole('textbox', { name: /search.*entity/i })).toBeInTheDocument();
		});

		it('should switch to Quick Add mode when Quick Add button is clicked', async () => {
			render(AddCombatantModal, { props: { open: true } });

			const quickAddButton = screen.getByRole('button', { name: /quick.*add/i });
			await fireEvent.click(quickAddButton);

			expect(quickAddButton).toHaveClass(/active|selected/);
		});

		it('should switch back to From Entity mode when From Entity button is clicked', async () => {
			render(AddCombatantModal, { props: { open: true } });

			const quickAddButton = screen.getByRole('button', { name: /quick.*add/i });
			const fromEntityButton = screen.getByRole('button', { name: /from.*entity/i });

			await fireEvent.click(quickAddButton);
			await fireEvent.click(fromEntityButton);

			expect(fromEntityButton).toHaveClass(/active|selected/);
		});
	});

	describe('Quick Add Form Fields', () => {
		it('should show simplified form in Quick Add mode', async () => {
			render(AddCombatantModal, { props: { open: true } });

			const quickAddButton = screen.getByRole('button', { name: /quick.*add/i });
			await fireEvent.click(quickAddButton);

			await waitFor(() => {
				// Should have name input
				expect(screen.getByLabelText(/^name$/i)).toBeInTheDocument();
				// Should have HP input
				expect(screen.getByLabelText(/^hp/i)).toBeInTheDocument();
				// Should have type selector
				expect(screen.getByLabelText(/type/i)).toBeInTheDocument();
			});
		});

		it('should not show entity search in Quick Add mode', async () => {
			render(AddCombatantModal, { props: { open: true } });

			const quickAddButton = screen.getByRole('button', { name: /quick.*add/i });
			await fireEvent.click(quickAddButton);

			await waitFor(() => {
				expect(screen.queryByRole('textbox', { name: /search.*entity/i })).not.toBeInTheDocument();
			});
		});

		it('should have name input field in Quick Add mode', async () => {
			render(AddCombatantModal, { props: { open: true } });

			const quickAddButton = screen.getByRole('button', { name: /quick.*add/i });
			await fireEvent.click(quickAddButton);

			await waitFor(() => {
				expect(screen.getByLabelText(/^name$/i)).toBeInTheDocument();
			});
		});

		it('should allow entering name in Quick Add mode', async () => {
			render(AddCombatantModal, { props: { open: true } });

			const quickAddButton = screen.getByRole('button', { name: /quick.*add/i });
			await fireEvent.click(quickAddButton);

			await waitFor(async () => {
				const nameInput = screen.getByLabelText(/^name$/i) as HTMLInputElement;
				await fireEvent.input(nameInput, { target: { value: 'Goblin Scout' } });
				expect(nameInput.value).toBe('Goblin Scout');
			});
		});

		it('should have HP input in Quick Add mode', async () => {
			render(AddCombatantModal, { props: { open: true } });

			const quickAddButton = screen.getByRole('button', { name: /quick.*add/i });
			await fireEvent.click(quickAddButton);

			await waitFor(() => {
				expect(screen.getByLabelText(/^hp/i)).toBeInTheDocument();
			});
		});

		it('should not require Max HP in Quick Add mode', async () => {
			render(AddCombatantModal, { props: { open: true } });

			const quickAddButton = screen.getByRole('button', { name: /quick.*add/i });
			await fireEvent.click(quickAddButton);

			await waitFor(() => {
				// Max HP field should not be present or not required
				const maxHpInput = screen.queryByLabelText(/max.*hp/i);
				if (maxHpInput) {
					expect(maxHpInput).not.toHaveAttribute('required');
				}
			});
		});

		it('should have type selector in Quick Add mode', async () => {
			render(AddCombatantModal, { props: { open: true } });

			const quickAddButton = screen.getByRole('button', { name: /quick.*add/i });
			await fireEvent.click(quickAddButton);

			await waitFor(() => {
				expect(screen.getByLabelText(/type/i)).toBeInTheDocument();
			});
		});

		it('should allow selecting Hero or Creature type in Quick Add mode', async () => {
			render(AddCombatantModal, { props: { open: true } });

			const quickAddButton = screen.getByRole('button', { name: /quick.*add/i });
			await fireEvent.click(quickAddButton);

			await waitFor(() => {
				const typeSelect = screen.getByLabelText(/type/i) as HTMLSelectElement;
				expect(typeSelect.options).toHaveLength(2);
			});
		});

		it('should have optional AC field in Quick Add mode', async () => {
			render(AddCombatantModal, { props: { open: true } });

			const quickAddButton = screen.getByRole('button', { name: /quick.*add/i });
			await fireEvent.click(quickAddButton);

			await waitFor(() => {
				const acInput = screen.queryByLabelText(/^ac/i);
				if (acInput) {
					expect(acInput).not.toHaveAttribute('required');
				}
			});
		});
	});

	describe('Quick Add Form Submission', () => {
		it('should submit with isAdHoc: true in Quick Add mode', async () => {
			const onAdd = vi.fn();
			render(AddCombatantModal, { props: { open: true, onAdd } });

			const quickAddButton = screen.getByRole('button', { name: /quick.*add/i });
			await fireEvent.click(quickAddButton);

			await waitFor(async () => {
				const nameInput = screen.getByLabelText(/^name$/i);
				const hpInput = screen.getByLabelText(/^hp/i);
				const typeSelect = screen.getByLabelText(/type/i);

				await fireEvent.input(nameInput, { target: { value: 'Goblin' } });
				await fireEvent.input(hpInput, { target: { value: '15' } });
				await fireEvent.change(typeSelect, { target: { value: 'creature' } });

				const addButton = screen.getByRole('button', { name: /^add$/i });
				await fireEvent.click(addButton);
			});

			expect(onAdd).toHaveBeenCalledWith(
				expect.objectContaining({
					name: 'Goblin',
					hp: 15,
					type: 'creature',
					isAdHoc: true
				})
			);
		});

		it('should not include entityId in Quick Add submission', async () => {
			const onAdd = vi.fn();
			render(AddCombatantModal, { props: { open: true, onAdd } });

			const quickAddButton = screen.getByRole('button', { name: /quick.*add/i });
			await fireEvent.click(quickAddButton);

			await waitFor(async () => {
				const nameInput = screen.getByLabelText(/^name$/i);
				const hpInput = screen.getByLabelText(/^hp/i);

				await fireEvent.input(nameInput, { target: { value: 'Orc' } });
				await fireEvent.input(hpInput, { target: { value: '20' } });

				const addButton = screen.getByRole('button', { name: /^add$/i });
				await fireEvent.click(addButton);
			});

			expect(onAdd).toHaveBeenCalledWith(
				expect.not.objectContaining({
					entityId: expect.anything()
				})
			);
		});

		it('should include optional AC in Quick Add submission', async () => {
			const onAdd = vi.fn();
			render(AddCombatantModal, { props: { open: true, onAdd } });

			const quickAddButton = screen.getByRole('button', { name: /quick.*add/i });
			await fireEvent.click(quickAddButton);

			await waitFor(async () => {
				const nameInput = screen.getByLabelText(/^name$/i);
				const hpInput = screen.getByLabelText(/^hp/i);
				const acInput = screen.getByLabelText(/^ac/i);

				await fireEvent.input(nameInput, { target: { value: 'Knight' } });
				await fireEvent.input(hpInput, { target: { value: '35' } });
				await fireEvent.input(acInput, { target: { value: '18' } });

				const addButton = screen.getByRole('button', { name: /^add$/i });
				await fireEvent.click(addButton);
			});

			expect(onAdd).toHaveBeenCalledWith(
				expect.objectContaining({
					ac: 18
				})
			);
		});

		it('should enable Add button when name and HP are provided in Quick Add mode', async () => {
			render(AddCombatantModal, { props: { open: true } });

			const quickAddButton = screen.getByRole('button', { name: /quick.*add/i });
			await fireEvent.click(quickAddButton);

			await waitFor(async () => {
				const nameInput = screen.getByLabelText(/^name$/i);
				const hpInput = screen.getByLabelText(/^hp/i);

				await fireEvent.input(nameInput, { target: { value: 'Minion' } });
				await fireEvent.input(hpInput, { target: { value: '10' } });
			});

			const addButton = screen.getByRole('button', { name: /^add$/i });
			expect(addButton).not.toBeDisabled();
		});
	});
});

describe('AddCombatantModal - Optional Fields in Entity Mode (Issue #233)', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockEntities = [
			createMockEntity({ id: 'char-1', name: 'Hero', type: 'character' })
		];
	});

	describe('Optional Max HP', () => {
		it('should not require Max HP for heroes in entity mode', async () => {
			render(AddCombatantModal, { props: { open: true } });

			// Entity mode is default, select a hero
			const entityButton = screen.getByText('Hero').closest('button');
			await fireEvent.click(entityButton!);

			await fireEvent.input(screen.getByLabelText(/^hp/i), { target: { value: '30' } });

			// Max HP should be optional
			const maxHpInput = screen.queryByLabelText(/max.*hp/i);
			if (maxHpInput) {
				expect(maxHpInput).not.toHaveAttribute('required');
			}
		});

		it('should not require heroicResource for heroes in entity mode', async () => {
			render(AddCombatantModal, { props: { open: true } });

			const entityButton = screen.getByText('Hero').closest('button');
			await fireEvent.click(entityButton!);

			await fireEvent.input(screen.getByLabelText(/^hp/i), { target: { value: '30' } });

			// Should be able to submit without heroic resource
			const resourceNameInput = screen.queryByLabelText(/resource.*name/i);
			if (resourceNameInput) {
				expect(resourceNameInput).not.toHaveAttribute('required');
			}
		});

		it('should enable Add button for hero with only HP in entity mode', async () => {
			render(AddCombatantModal, { props: { open: true } });

			const entityButton = screen.getByText('Hero').closest('button');
			await fireEvent.click(entityButton!);

			await fireEvent.input(screen.getByLabelText(/^hp/i), { target: { value: '30' } });

			await waitFor(() => {
				const addButton = screen.getByRole('button', { name: /^add$/i });
				expect(addButton).not.toBeDisabled();
			});
		});

		it('should not show "HP cannot exceed Max HP" validation when maxHp not provided', async () => {
			render(AddCombatantModal, { props: { open: true } });

			const entityButton = screen.getByText('Hero').closest('button');
			await fireEvent.click(entityButton!);

			await fireEvent.input(screen.getByLabelText(/^hp/i), { target: { value: '100' } });

			// Should not show max HP validation error
			await waitFor(() => {
				expect(screen.queryByText(/hp.*cannot.*exceed.*max/i)).not.toBeInTheDocument();
			});
		});

		it('should call onAdd with hero data without maxHp when not provided', async () => {
			const onAdd = vi.fn();
			render(AddCombatantModal, { props: { open: true, onAdd } });

			const entityButton = screen.getByText('Hero').closest('button');
			await fireEvent.click(entityButton!);

			await fireEvent.input(screen.getByLabelText(/^hp/i), { target: { value: '30' } });

			const addButton = screen.getByRole('button', { name: /^add$/i });
			await fireEvent.click(addButton);

			await waitFor(() => {
				expect(onAdd).toHaveBeenCalledWith(
					expect.objectContaining({
						type: 'hero',
						hp: 30
					})
				);
				expect(onAdd).toHaveBeenCalledWith(
					expect.not.objectContaining({
						maxHp: expect.anything()
					})
				);
			});
		});

		it('should call onAdd with hero data without heroicResource when not provided', async () => {
			const onAdd = vi.fn();
			render(AddCombatantModal, { props: { open: true, onAdd } });

			const entityButton = screen.getByText('Hero').closest('button');
			await fireEvent.click(entityButton!);

			await fireEvent.input(screen.getByLabelText(/^hp/i), { target: { value: '30' } });

			const addButton = screen.getByRole('button', { name: /^add$/i });
			await fireEvent.click(addButton);

			await waitFor(() => {
				expect(onAdd).toHaveBeenCalledWith(
					expect.not.objectContaining({
						heroicResource: expect.anything()
					})
				);
			});
		});

		it('should still validate HP is positive in entity mode', async () => {
			render(AddCombatantModal, { props: { open: true } });

			const entityButton = screen.getByText('Hero').closest('button');
			await fireEvent.click(entityButton!);

			await fireEvent.input(screen.getByLabelText(/^hp/i), { target: { value: '-10' } });

			await waitFor(() => {
				expect(screen.getByText(/hp.*must be.*positive/i)).toBeInTheDocument();
			});
		});

		it('should still validate HP when both HP and Max HP provided', async () => {
			render(AddCombatantModal, { props: { open: true } });

			const entityButton = screen.getByText('Hero').closest('button');
			await fireEvent.click(entityButton!);

			await fireEvent.input(screen.getByLabelText(/^hp/i), { target: { value: '50' } });

			const maxHpInput = screen.queryByLabelText(/max.*hp/i);
			if (maxHpInput) {
				await fireEvent.input(maxHpInput, { target: { value: '40' } });

				await waitFor(() => {
					expect(screen.getByText(/hp.*cannot.*exceed.*max/i)).toBeInTheDocument();
				});
			}
		});
	});
});
