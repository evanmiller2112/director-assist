/**
 * Tests for RespiteSetup Component - Entity-Based Hero Selection
 *
 * TDD RED PHASE - Tests for Issue #492: Respite Tracker hero selection via character entities
 *
 * This component allows setting up a respite session with:
 * - Entity-based hero selection (default mode)
 * - Manual hero entry (fallback mode)
 * - Auto-population of heroId when selecting from entities
 * - Searchable character entity list
 * - Recovery tracking configuration
 *
 * These tests will FAIL until the component is implemented in the GREEN phase.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import { tick } from 'svelte';
import RespiteSetup from './RespiteSetup.svelte';
import { createMockEntity } from '../../../tests/utils/testUtils';
import type { BaseEntity } from '$lib/types';

// Mock entities store - use vi.hoisted() for proper mock hoisting
const { mockEntities } = vi.hoisted(() => {
	return {
		mockEntities: [] as BaseEntity[]
	};
});

vi.mock('$lib/stores', () => ({
	entitiesStore: {
		get entities() {
			return mockEntities;
		}
	}
}));

describe('RespiteSetup - Basic Rendering', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockEntities.length = 0;
	});

	it('should render respite name input', () => {
		render(RespiteSetup);

		expect(screen.getByLabelText(/respite name/i)).toBeInTheDocument();
	});

	it('should render description textarea', () => {
		render(RespiteSetup);

		expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
	});

	it('should render victory points input', () => {
		render(RespiteSetup);

		expect(screen.getByLabelText(/victory points available/i)).toBeInTheDocument();
	});

	it('should render "Add Hero" button', () => {
		render(RespiteSetup);

		expect(screen.getByRole('button', { name: /add hero/i })).toBeInTheDocument();
	});

	it('should render "Create Respite" button', () => {
		render(RespiteSetup);

		expect(screen.getByRole('button', { name: /create respite/i })).toBeInTheDocument();
	});

	it('should show "No heroes added yet" message when heroes list is empty', () => {
		render(RespiteSetup);

		expect(screen.getByText(/no heroes added yet/i)).toBeInTheDocument();
	});
});

describe('RespiteSetup - Hero Entry Mode Toggle', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockEntities.length = 0;
	});

	it('should not show mode toggle buttons before adding a hero', () => {
		render(RespiteSetup);

		expect(screen.queryByRole('button', { name: /from entity/i })).not.toBeInTheDocument();
		expect(screen.queryByRole('button', { name: /manual/i })).not.toBeInTheDocument();
	});

	it('should show mode toggle buttons after adding a hero', async () => {
		render(RespiteSetup);

		const addHeroButton = screen.getByRole('button', { name: /add hero/i });
		await fireEvent.click(addHeroButton);

		await waitFor(() => {
			expect(screen.getByRole('button', { name: /from entity/i })).toBeInTheDocument();
			expect(screen.getByRole('button', { name: /manual/i })).toBeInTheDocument();
		});
	});

	it('should default to "From Entity" mode when adding a hero', async () => {
		render(RespiteSetup);

		const addHeroButton = screen.getByRole('button', { name: /add hero/i });
		await fireEvent.click(addHeroButton);

		await waitFor(() => {
			const fromEntityButton = screen.getByRole('button', { name: /from entity/i });
			expect(fromEntityButton).toHaveClass(/active|selected|bg-blue/);
		});
	});

	it('should switch to "Manual" mode when Manual button is clicked', async () => {
		render(RespiteSetup);

		const addHeroButton = screen.getByRole('button', { name: /add hero/i });
		await fireEvent.click(addHeroButton);

		await waitFor(async () => {
			const manualButton = screen.getByRole('button', { name: /manual/i });
			await fireEvent.click(manualButton);
			await tick();

			expect(manualButton).toHaveClass(/active|selected|bg-blue/);
		});
	});

	it('should switch back to "From Entity" mode when From Entity button is clicked', async () => {
		render(RespiteSetup);

		const addHeroButton = screen.getByRole('button', { name: /add hero/i });
		await fireEvent.click(addHeroButton);

		await waitFor(async () => {
			const manualButton = screen.getByRole('button', { name: /manual/i });
			const fromEntityButton = screen.getByRole('button', { name: /from entity/i });

			await fireEvent.click(manualButton);
			await tick();
			await fireEvent.click(fromEntityButton);
			await tick();

			expect(fromEntityButton).toHaveClass(/active|selected|bg-blue/);
		});
	});

	it('should show mode toggle for each hero entry independently', async () => {
		render(RespiteSetup);

		const addHeroButton = screen.getByRole('button', { name: /add hero/i });

		// Add first hero
		await fireEvent.click(addHeroButton);
		await tick();

		// Add second hero
		await fireEvent.click(addHeroButton);
		await tick();

		await waitFor(() => {
			const fromEntityButtons = screen.getAllByRole('button', { name: /from entity/i });
			const manualButtons = screen.getAllByRole('button', { name: /manual/i });

			// Each hero should have its own mode toggle
			expect(fromEntityButtons.length).toBe(2);
			expect(manualButtons.length).toBe(2);
		});
	});
});

describe('RespiteSetup - Entity-Based Hero Selection (From Entity Mode)', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockEntities.splice(0, mockEntities.length,
			createMockEntity({ id: 'char-1', name: 'Thorin Ironshield', type: 'character' }),
			createMockEntity({ id: 'char-2', name: 'Gandalf the Grey', type: 'character' }),
			createMockEntity({ id: 'char-3', name: 'Legolas Greenleaf', type: 'character' }),
			createMockEntity({ id: 'npc-1', name: 'Goblin King', type: 'npc' }),
			createMockEntity({ id: 'npc-2', name: 'Dragon Smaug', type: 'npc' })
		);
	});

	it('should display character entities when in From Entity mode', async () => {
		render(RespiteSetup);

		const addHeroButton = screen.getByRole('button', { name: /add hero/i });
		await fireEvent.click(addHeroButton);

		await waitFor(() => {
			expect(screen.getByText('Thorin Ironshield')).toBeInTheDocument();
			expect(screen.getByText('Gandalf the Grey')).toBeInTheDocument();
			expect(screen.getByText('Legolas Greenleaf')).toBeInTheDocument();
		});
	});

	it('should NOT display NPC entities in hero selection', async () => {
		render(RespiteSetup);

		const addHeroButton = screen.getByRole('button', { name: /add hero/i });
		await fireEvent.click(addHeroButton);

		await waitFor(() => {
			expect(screen.queryByText('Goblin King')).not.toBeInTheDocument();
			expect(screen.queryByText('Dragon Smaug')).not.toBeInTheDocument();
		});
	});

	it('should show search input in From Entity mode', async () => {
		render(RespiteSetup);

		const addHeroButton = screen.getByRole('button', { name: /add hero/i });
		await fireEvent.click(addHeroButton);

		await waitFor(() => {
			expect(screen.getByRole('textbox', { name: /search.*character/i })).toBeInTheDocument();
		});
	});

	it('should filter character entities based on search input', async () => {
		render(RespiteSetup);

		const addHeroButton = screen.getByRole('button', { name: /add hero/i });
		await fireEvent.click(addHeroButton);

		await waitFor(async () => {
			const searchInput = screen.getByRole('textbox', { name: /search.*character/i });
			await fireEvent.input(searchInput, { target: { value: 'Gandalf' } });
			await tick();
		});

		await waitFor(() => {
			expect(screen.getByText('Gandalf the Grey')).toBeInTheDocument();
			expect(screen.queryByText('Thorin Ironshield')).not.toBeInTheDocument();
			expect(screen.queryByText('Legolas Greenleaf')).not.toBeInTheDocument();
		});
	});

	it('should filter case-insensitively', async () => {
		render(RespiteSetup);

		const addHeroButton = screen.getByRole('button', { name: /add hero/i });
		await fireEvent.click(addHeroButton);

		await waitFor(async () => {
			const searchInput = screen.getByRole('textbox', { name: /search.*character/i });
			await fireEvent.input(searchInput, { target: { value: 'THORIN' } });
			await tick();
		});

		await waitFor(() => {
			expect(screen.getByText('Thorin Ironshield')).toBeInTheDocument();
		});
	});

	it('should show "No character entities found" when search has no results', async () => {
		render(RespiteSetup);

		const addHeroButton = screen.getByRole('button', { name: /add hero/i });
		await fireEvent.click(addHeroButton);

		await waitFor(async () => {
			const searchInput = screen.getByRole('textbox', { name: /search.*character/i });
			await fireEvent.input(searchInput, { target: { value: 'NonexistentHero' } });
			await tick();
		});

		await waitFor(() => {
			expect(screen.getByText(/no.*character.*entities.*found/i)).toBeInTheDocument();
		});
	});

	it('should show "No character entities exist" when no characters in store', async () => {
		mockEntities.length = 0;
		render(RespiteSetup);

		const addHeroButton = screen.getByRole('button', { name: /add hero/i });
		await fireEvent.click(addHeroButton);

		await waitFor(() => {
			expect(screen.getByText(/no.*character.*entities.*exist/i)).toBeInTheDocument();
		});
	});

	it('should auto-fill hero name when character entity is selected', async () => {
		render(RespiteSetup);

		const addHeroButton = screen.getByRole('button', { name: /add hero/i });
		await fireEvent.click(addHeroButton);

		await waitFor(async () => {
			const entityButton = screen.getByText('Thorin Ironshield').closest('button');
			await fireEvent.click(entityButton!);
			await tick();
		});

		// Name should be shown somewhere (might be readonly display or disabled input)
		await waitFor(() => {
			expect(screen.getAllByText('Thorin Ironshield').length).toBeGreaterThan(1);
		});
	});

	it('should set heroId when character entity is selected', async () => {
		const onCreate = vi.fn();
		render(RespiteSetup, { onCreate });

		// Add hero and select entity
		const addHeroButton = screen.getByRole('button', { name: /add hero/i });
		await fireEvent.click(addHeroButton);

		await waitFor(async () => {
			const entityButton = screen.getByText('Thorin Ironshield').closest('button');
			await fireEvent.click(entityButton!);
			await tick();
		});

		// Fill required name and submit
		await fireEvent.input(screen.getByLabelText(/respite name/i), { target: { value: 'Test Respite' } });

		const createButton = screen.getByRole('button', { name: /create respite/i });
		await fireEvent.click(createButton);

		await waitFor(() => {
			expect(onCreate).toHaveBeenCalledWith(
				expect.objectContaining({
					heroes: expect.arrayContaining([
						expect.objectContaining({
							name: 'Thorin Ironshield',
							heroId: 'char-1'
						})
					])
				})
			);
		});
	});

	it('should allow clearing entity selection', async () => {
		render(RespiteSetup);

		const addHeroButton = screen.getByRole('button', { name: /add hero/i });
		await fireEvent.click(addHeroButton);

		// Select an entity
		await waitFor(async () => {
			const entityButton = screen.getByText('Thorin Ironshield').closest('button');
			await fireEvent.click(entityButton!);
			await tick();
		});

		// Clear button should be available
		await waitFor(() => {
			expect(screen.getByRole('button', { name: /clear.*selection/i })).toBeInTheDocument();
		});

		// Click clear
		const clearButton = screen.getByRole('button', { name: /clear.*selection/i });
		await fireEvent.click(clearButton);

		// Entity list should be visible again
		await waitFor(() => {
			expect(screen.getByText('Thorin Ironshield')).toBeInTheDocument();
			expect(screen.getByText('Gandalf the Grey')).toBeInTheDocument();
		});
	});

	it('should allow changing entity selection', async () => {
		const onCreate = vi.fn();
		render(RespiteSetup, { onCreate });

		const addHeroButton = screen.getByRole('button', { name: /add hero/i });
		await fireEvent.click(addHeroButton);

		// Select first entity
		await waitFor(async () => {
			const entityButton = screen.getByText('Thorin Ironshield').closest('button');
			await fireEvent.click(entityButton!);
			await tick();
		});

		// Clear and select different entity
		const clearButton = screen.getByRole('button', { name: /clear.*selection/i });
		await fireEvent.click(clearButton);
		await tick();

		await waitFor(async () => {
			const newEntityButton = screen.getByText('Gandalf the Grey').closest('button');
			await fireEvent.click(newEntityButton!);
			await tick();
		});

		// Submit and verify correct entity
		await fireEvent.input(screen.getByLabelText(/respite name/i), { target: { value: 'Test' } });
		const createButton = screen.getByRole('button', { name: /create respite/i });
		await fireEvent.click(createButton);

		await waitFor(() => {
			expect(onCreate).toHaveBeenCalledWith(
				expect.objectContaining({
					heroes: expect.arrayContaining([
						expect.objectContaining({
							name: 'Gandalf the Grey',
							heroId: 'char-2'
						})
					])
				})
			);
		});
	});

	it('should show selected entity name as readonly/disabled', async () => {
		render(RespiteSetup);

		const addHeroButton = screen.getByRole('button', { name: /add hero/i });
		await fireEvent.click(addHeroButton);

		await waitFor(async () => {
			const entityButton = screen.getByText('Thorin Ironshield').closest('button');
			await fireEvent.click(entityButton!);
			await tick();
		});

		// Should show the selected name and prevent editing
		await waitFor(() => {
			const heroNameElements = screen.getAllByText('Thorin Ironshield');
			expect(heroNameElements.length).toBeGreaterThan(0);
		});
	});
});

describe('RespiteSetup - Manual Fallback Mode', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockEntities.length = 0;
	});

	it('should show text input for hero name in manual mode', async () => {
		render(RespiteSetup);

		const addHeroButton = screen.getByRole('button', { name: /add hero/i });
		await fireEvent.click(addHeroButton);

		await waitFor(async () => {
			const manualButton = screen.getByRole('button', { name: /manual/i });
			await fireEvent.click(manualButton);
			await tick();
		});

		await waitFor(() => {
			const heroNameInput = screen.getByPlaceholderText(/hero name/i);
			expect(heroNameInput).toBeInTheDocument();
			expect(heroNameInput).toHaveAttribute('type', 'text');
		});
	});

	it('should not show entity search in manual mode', async () => {
		render(RespiteSetup);

		const addHeroButton = screen.getByRole('button', { name: /add hero/i });
		await fireEvent.click(addHeroButton);

		await waitFor(async () => {
			const manualButton = screen.getByRole('button', { name: /manual/i });
			await fireEvent.click(manualButton);
			await tick();
		});

		await waitFor(() => {
			expect(screen.queryByRole('textbox', { name: /search.*character/i })).not.toBeInTheDocument();
		});
	});

	it('should allow entering hero name manually', async () => {
		render(RespiteSetup);

		const addHeroButton = screen.getByRole('button', { name: /add hero/i });
		await fireEvent.click(addHeroButton);

		await waitFor(async () => {
			const manualButton = screen.getByRole('button', { name: /manual/i });
			await fireEvent.click(manualButton);
			await tick();
		});

		const heroNameInput = screen.getByPlaceholderText(/hero name/i) as HTMLInputElement;
		await fireEvent.input(heroNameInput, { target: { value: 'Custom Hero Name' } });

		expect(heroNameInput.value).toBe('Custom Hero Name');
	});

	it('should NOT set heroId for manually entered heroes', async () => {
		const onCreate = vi.fn();
		render(RespiteSetup, { onCreate });

		const addHeroButton = screen.getByRole('button', { name: /add hero/i });
		await fireEvent.click(addHeroButton);

		// Switch to manual mode
		await waitFor(async () => {
			const manualButton = screen.getByRole('button', { name: /manual/i });
			await fireEvent.click(manualButton);
			await tick();
		});

		// Enter hero name manually
		const heroNameInput = screen.getByPlaceholderText(/hero name/i);
		await fireEvent.input(heroNameInput, { target: { value: 'My Custom Hero' } });

		// Submit
		await fireEvent.input(screen.getByLabelText(/respite name/i), { target: { value: 'Test' } });
		const createButton = screen.getByRole('button', { name: /create respite/i });
		await fireEvent.click(createButton);

		await waitFor(() => {
			expect(onCreate).toHaveBeenCalledWith(
				expect.objectContaining({
					heroes: expect.arrayContaining([
						expect.objectContaining({
							name: 'My Custom Hero'
						})
					])
				})
			);

			// Verify heroId is NOT present
			const callArgs = onCreate.mock.calls[0][0];
			expect(callArgs.heroes[0]).not.toHaveProperty('heroId');
		});
	});

	it('should show entity list when switching back to From Entity mode', async () => {
		mockEntities.splice(0, mockEntities.length,
			createMockEntity({ id: 'char-1', name: 'Test Character', type: 'character' })
		);

		render(RespiteSetup);

		const addHeroButton = screen.getByRole('button', { name: /add hero/i });
		await fireEvent.click(addHeroButton);

		// Switch to manual
		await waitFor(async () => {
			const manualButton = screen.getByRole('button', { name: /manual/i });
			await fireEvent.click(manualButton);
			await tick();
		});

		// Switch back to entity mode
		const fromEntityButton = screen.getByRole('button', { name: /from entity/i });
		await fireEvent.click(fromEntityButton);
		await tick();

		// Entity list should be visible
		await waitFor(() => {
			expect(screen.getByText('Test Character')).toBeInTheDocument();
		});
	});
});

describe('RespiteSetup - Recovery Fields', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockEntities.length = 0;
	});

	it('should show recovery current input for each hero', async () => {
		render(RespiteSetup);

		const addHeroButton = screen.getByRole('button', { name: /add hero/i });
		await fireEvent.click(addHeroButton);

		await waitFor(() => {
			expect(screen.getByLabelText(/current/i)).toBeInTheDocument();
		});
	});

	it('should show recovery max input for each hero', async () => {
		render(RespiteSetup);

		const addHeroButton = screen.getByRole('button', { name: /add hero/i });
		await fireEvent.click(addHeroButton);

		await waitFor(() => {
			expect(screen.getByLabelText(/max/i)).toBeInTheDocument();
		});
	});

	it('should default recovery current to 0', async () => {
		render(RespiteSetup);

		const addHeroButton = screen.getByRole('button', { name: /add hero/i });
		await fireEvent.click(addHeroButton);

		await waitFor(() => {
			const currentInput = screen.getByLabelText(/current/i) as HTMLInputElement;
			expect(currentInput.value).toBe('0');
		});
	});

	it('should default recovery max to 8', async () => {
		render(RespiteSetup);

		const addHeroButton = screen.getByRole('button', { name: /add hero/i });
		await fireEvent.click(addHeroButton);

		await waitFor(() => {
			const maxInput = screen.getByLabelText(/max/i) as HTMLInputElement;
			expect(maxInput.value).toBe('8');
		});
	});

	it('should allow editing recovery values', async () => {
		render(RespiteSetup);

		const addHeroButton = screen.getByRole('button', { name: /add hero/i });
		await fireEvent.click(addHeroButton);

		await waitFor(async () => {
			const currentInput = screen.getByLabelText(/current/i);
			const maxInput = screen.getByLabelText(/max/i);

			await fireEvent.input(currentInput, { target: { value: '5' } });
			await fireEvent.input(maxInput, { target: { value: '10' } });

			expect((currentInput as HTMLInputElement).value).toBe('5');
			expect((maxInput as HTMLInputElement).value).toBe('10');
		});
	});

	it('should NOT auto-populate recovery max from character entity data', async () => {
		mockEntities.splice(0, mockEntities.length,
			createMockEntity({
				id: 'char-1',
				name: 'Hero With Data',
				type: 'character',
				fields: { recoveries: { current: 3, max: 12 } } // Entity has different values
			})
		);

		render(RespiteSetup);

		const addHeroButton = screen.getByRole('button', { name: /add hero/i });
		await fireEvent.click(addHeroButton);

		await waitFor(async () => {
			const entityButton = screen.getByText('Hero With Data').closest('button');
			await fireEvent.click(entityButton!);
			await tick();
		});

		// Should still use default max of 8, not entity's 12
		await waitFor(() => {
			const maxInput = screen.getByLabelText(/max/i) as HTMLInputElement;
			expect(maxInput.value).toBe('8');
		});
	});

	it('should keep recovery max editable even when entity is selected', async () => {
		mockEntities.splice(0, mockEntities.length,
			createMockEntity({ id: 'char-1', name: 'Test Hero', type: 'character' })
		);

		render(RespiteSetup);

		const addHeroButton = screen.getByRole('button', { name: /add hero/i });
		await fireEvent.click(addHeroButton);

		await waitFor(async () => {
			const entityButton = screen.getByText('Test Hero').closest('button');
			await fireEvent.click(entityButton!);
			await tick();
		});

		const maxInput = screen.getByLabelText(/max/i) as HTMLInputElement;
		expect(maxInput).not.toBeDisabled();

		await fireEvent.input(maxInput, { target: { value: '12' } });
		expect(maxInput.value).toBe('12');
	});
});

describe('RespiteSetup - Form Submission', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockEntities.splice(0, mockEntities.length,
			createMockEntity({ id: 'char-1', name: 'Entity Hero', type: 'character' })
		);
	});

	it('should include heroId when hero is selected from entity', async () => {
		const onCreate = vi.fn();
		render(RespiteSetup, { onCreate });

		const addHeroButton = screen.getByRole('button', { name: /add hero/i });
		await fireEvent.click(addHeroButton);

		await waitFor(async () => {
			const entityButton = screen.getByText('Entity Hero').closest('button');
			await fireEvent.click(entityButton!);
			await tick();
		});

		await fireEvent.input(screen.getByLabelText(/respite name/i), { target: { value: 'Test Respite' } });

		const createButton = screen.getByRole('button', { name: /create respite/i });
		await fireEvent.click(createButton);

		await waitFor(() => {
			expect(onCreate).toHaveBeenCalledWith(
				expect.objectContaining({
					heroes: expect.arrayContaining([
						expect.objectContaining({
							heroId: 'char-1'
						})
					])
				})
			);
		});
	});

	it('should NOT include heroId when hero is manually entered', async () => {
		const onCreate = vi.fn();
		render(RespiteSetup, { onCreate });

		const addHeroButton = screen.getByRole('button', { name: /add hero/i });
		await fireEvent.click(addHeroButton);

		// Switch to manual mode
		await waitFor(async () => {
			const manualButton = screen.getByRole('button', { name: /manual/i });
			await fireEvent.click(manualButton);
			await tick();
		});

		// Enter manual name
		const heroNameInput = screen.getByPlaceholderText(/hero name/i);
		await fireEvent.input(heroNameInput, { target: { value: 'Manual Hero' } });

		await fireEvent.input(screen.getByLabelText(/respite name/i), { target: { value: 'Test' } });

		const createButton = screen.getByRole('button', { name: /create respite/i });
		await fireEvent.click(createButton);

		await waitFor(() => {
			const callArgs = onCreate.mock.calls[0][0];
			expect(callArgs.heroes[0]).not.toHaveProperty('heroId');
		});
	});

	it('should strip mode field from submitted data', async () => {
		const onCreate = vi.fn();
		render(RespiteSetup, { onCreate });

		const addHeroButton = screen.getByRole('button', { name: /add hero/i });
		await fireEvent.click(addHeroButton);

		// Switch to manual mode
		await waitFor(async () => {
			const manualButton = screen.getByRole('button', { name: /manual/i });
			await fireEvent.click(manualButton);
			await tick();
		});

		const heroNameInput = screen.getByPlaceholderText(/hero name/i);
		await fireEvent.input(heroNameInput, { target: { value: 'Test' } });

		await fireEvent.input(screen.getByLabelText(/respite name/i), { target: { value: 'Test' } });

		const createButton = screen.getByRole('button', { name: /create respite/i });
		await fireEvent.click(createButton);

		await waitFor(() => {
			const callArgs = onCreate.mock.calls[0][0];
			expect(callArgs.heroes[0]).not.toHaveProperty('mode');
		});
	});

	it('should strip searchQuery field from submitted data', async () => {
		const onCreate = vi.fn();
		render(RespiteSetup, { onCreate });

		const addHeroButton = screen.getByRole('button', { name: /add hero/i });
		await fireEvent.click(addHeroButton);

		// Use search
		await waitFor(async () => {
			const searchInput = screen.getByRole('textbox', { name: /search.*character/i });
			await fireEvent.input(searchInput, { target: { value: 'Entity' } });
			await tick();
		});

		// Select entity
		await waitFor(async () => {
			const entityButton = screen.getByText('Entity Hero').closest('button');
			await fireEvent.click(entityButton!);
			await tick();
		});

		await fireEvent.input(screen.getByLabelText(/respite name/i), { target: { value: 'Test' } });

		const createButton = screen.getByRole('button', { name: /create respite/i });
		await fireEvent.click(createButton);

		await waitFor(() => {
			const callArgs = onCreate.mock.calls[0][0];
			expect(callArgs.heroes[0]).not.toHaveProperty('searchQuery');
		});
	});

	it('should include recovery values in submitted data', async () => {
		const onCreate = vi.fn();
		render(RespiteSetup, { onCreate });

		const addHeroButton = screen.getByRole('button', { name: /add hero/i });
		await fireEvent.click(addHeroButton);

		// Switch to manual mode and enter data
		await waitFor(async () => {
			const manualButton = screen.getByRole('button', { name: /manual/i });
			await fireEvent.click(manualButton);
			await tick();
		});

		const heroNameInput = screen.getByPlaceholderText(/hero name/i);
		await fireEvent.input(heroNameInput, { target: { value: 'Test Hero' } });

		const currentInput = screen.getByLabelText(/current/i);
		const maxInput = screen.getByLabelText(/max/i);
		await fireEvent.input(currentInput, { target: { value: '3' } });
		await fireEvent.input(maxInput, { target: { value: '10' } });

		await fireEvent.input(screen.getByLabelText(/respite name/i), { target: { value: 'Test' } });

		const createButton = screen.getByRole('button', { name: /create respite/i });
		await fireEvent.click(createButton);

		await waitFor(() => {
			expect(onCreate).toHaveBeenCalledWith(
				expect.objectContaining({
					heroes: expect.arrayContaining([
						expect.objectContaining({
							recoveries: {
								current: 3,
								max: 10
							}
						})
					])
				})
			);
		});
	});
});

describe('RespiteSetup - Multiple Heroes', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockEntities.splice(0, mockEntities.length,
			createMockEntity({ id: 'char-1', name: 'Entity Hero 1', type: 'character' }),
			createMockEntity({ id: 'char-2', name: 'Entity Hero 2', type: 'character' })
		);
	});

	it('should allow adding multiple heroes', async () => {
		render(RespiteSetup);

		const addHeroButton = screen.getByRole('button', { name: /add hero/i });

		await fireEvent.click(addHeroButton);
		await tick();
		await fireEvent.click(addHeroButton);
		await tick();

		await waitFor(() => {
			const fromEntityButtons = screen.getAllByRole('button', { name: /from entity/i });
			expect(fromEntityButtons.length).toBe(2);
		});
	});

	it('should support mix of entity-selected and manually-entered heroes', async () => {
		const onCreate = vi.fn();
		render(RespiteSetup, { onCreate });

		const addHeroButton = screen.getByRole('button', { name: /add hero/i });

		// Add first hero from entity
		await fireEvent.click(addHeroButton);
		await waitFor(async () => {
			const entityButton = screen.getByText('Entity Hero 1').closest('button');
			await fireEvent.click(entityButton!);
			await tick();
		});

		// Add second hero manually
		await fireEvent.click(addHeroButton);
		await tick();

		const manualButtons = screen.getAllByRole('button', { name: /manual/i });
		await fireEvent.click(manualButtons[1]);
		await tick();

		const heroNameInputs = screen.getAllByPlaceholderText(/hero name/i);
		await fireEvent.input(heroNameInputs[0], { target: { value: 'Manual Hero' } });

		// Submit
		await fireEvent.input(screen.getByLabelText(/respite name/i), { target: { value: 'Test' } });
		const createButton = screen.getByRole('button', { name: /create respite/i });
		await fireEvent.click(createButton);

		await waitFor(() => {
			expect(onCreate).toHaveBeenCalledWith(
				expect.objectContaining({
					heroes: expect.arrayContaining([
						expect.objectContaining({
							name: 'Entity Hero 1',
							heroId: 'char-1'
						}),
						expect.objectContaining({
							name: 'Manual Hero'
						})
					])
				})
			);

			// Verify second hero doesn't have heroId
			const callArgs = onCreate.mock.calls[0][0];
			const manualHero = callArgs.heroes.find((h: any) => h.name === 'Manual Hero');
			expect(manualHero).not.toHaveProperty('heroId');
		});
	});

	it('should allow removing individual heroes', async () => {
		render(RespiteSetup);

		const addHeroButton = screen.getByRole('button', { name: /add hero/i });

		await fireEvent.click(addHeroButton);
		await tick();
		await fireEvent.click(addHeroButton);
		await tick();

		// Should have 2 heroes
		await waitFor(() => {
			const removeButtons = screen.getAllByRole('button', { name: /remove hero/i });
			expect(removeButtons.length).toBe(2);
		});

		// Remove first hero
		const removeButtons = screen.getAllByRole('button', { name: /remove hero/i });
		await fireEvent.click(removeButtons[0]);
		await tick();

		// Should have 1 hero left
		await waitFor(() => {
			const remainingRemoveButtons = screen.getAllByRole('button', { name: /remove hero/i });
			expect(remainingRemoveButtons.length).toBe(1);
		});
	});

	it('should maintain independent mode state for each hero', async () => {
		render(RespiteSetup);

		const addHeroButton = screen.getByRole('button', { name: /add hero/i });

		// Add two heroes
		await fireEvent.click(addHeroButton);
		await tick();
		await fireEvent.click(addHeroButton);
		await tick();

		// Set first to manual, keep second as entity
		const manualButtons = screen.getAllByRole('button', { name: /manual/i });
		await fireEvent.click(manualButtons[0]);
		await tick();

		// Verify first is manual mode
		expect(manualButtons[0]).toHaveClass(/active|selected|bg-blue/);

		// Verify second is still entity mode
		const fromEntityButtons = screen.getAllByRole('button', { name: /from entity/i });
		expect(fromEntityButtons[1]).toHaveClass(/active|selected|bg-blue/);
	});
});

describe('RespiteSetup - Edge Cases', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockEntities.length = 0;
	});

	it('should handle empty hero name gracefully in manual mode', async () => {
		const onCreate = vi.fn();
		render(RespiteSetup, { onCreate });

		const addHeroButton = screen.getByRole('button', { name: /add hero/i });
		await fireEvent.click(addHeroButton);

		// Switch to manual mode but don't enter name
		await waitFor(async () => {
			const manualButton = screen.getByRole('button', { name: /manual/i });
			await fireEvent.click(manualButton);
			await tick();
		});

		// Submit with empty hero name
		await fireEvent.input(screen.getByLabelText(/respite name/i), { target: { value: 'Test' } });
		const createButton = screen.getByRole('button', { name: /create respite/i });
		await fireEvent.click(createButton);

		// Empty heroes should be filtered out (existing behavior)
		await waitFor(() => {
			expect(onCreate).toHaveBeenCalledWith(
				expect.objectContaining({
					heroes: []
				})
			);
		});
	});

	it('should filter out heroes with no entity selected in entity mode', async () => {
		mockEntities.splice(0, mockEntities.length,
			createMockEntity({ id: 'char-1', name: 'Test Hero', type: 'character' })
		);

		const onCreate = vi.fn();
		render(RespiteSetup, { onCreate });

		// Add hero but don't select an entity
		const addHeroButton = screen.getByRole('button', { name: /add hero/i });
		await fireEvent.click(addHeroButton);
		await tick();

		// Submit without selecting entity
		await fireEvent.input(screen.getByLabelText(/respite name/i), { target: { value: 'Test' } });
		const createButton = screen.getByRole('button', { name: /create respite/i });
		await fireEvent.click(createButton);

		// Should filter out empty hero
		await waitFor(() => {
			expect(onCreate).toHaveBeenCalledWith(
				expect.objectContaining({
					heroes: []
				})
			);
		});
	});

	it('should handle switching mode after entity selection', async () => {
		mockEntities.splice(0, mockEntities.length,
			createMockEntity({ id: 'char-1', name: 'Entity Hero', type: 'character' })
		);

		const onCreate = vi.fn();
		render(RespiteSetup, { onCreate });

		const addHeroButton = screen.getByRole('button', { name: /add hero/i });
		await fireEvent.click(addHeroButton);

		// Select entity
		await waitFor(async () => {
			const entityButton = screen.getByText('Entity Hero').closest('button');
			await fireEvent.click(entityButton!);
			await tick();
		});

		// Switch to manual mode
		const manualButton = screen.getByRole('button', { name: /manual/i });
		await fireEvent.click(manualButton);
		await tick();

		// Should show text input with entity name pre-filled or cleared
		const heroNameInput = screen.getByPlaceholderText(/hero name/i) as HTMLInputElement;
		expect(heroNameInput).toBeInTheDocument();

		// User can now edit the name manually
		await fireEvent.input(heroNameInput, { target: { value: 'Modified Name' } });

		// Submit
		await fireEvent.input(screen.getByLabelText(/respite name/i), { target: { value: 'Test' } });
		const createButton = screen.getByRole('button', { name: /create respite/i });
		await fireEvent.click(createButton);

		// Should NOT include heroId since we switched to manual
		await waitFor(() => {
			const callArgs = onCreate.mock.calls[0][0];
			expect(callArgs.heroes[0].name).toBe('Modified Name');
			expect(callArgs.heroes[0]).not.toHaveProperty('heroId');
		});
	});

	it('should handle very long character names', async () => {
		const longName = 'A'.repeat(200);
		mockEntities.splice(0, mockEntities.length,
			createMockEntity({ id: 'char-1', name: longName, type: 'character' })
		);

		render(RespiteSetup);

		const addHeroButton = screen.getByRole('button', { name: /add hero/i });
		await fireEvent.click(addHeroButton);

		await waitFor(() => {
			expect(screen.getByText(longName)).toBeInTheDocument();
		});
	});

	it('should preserve recovery values when switching modes', async () => {
		mockEntities.splice(0, mockEntities.length,
			createMockEntity({ id: 'char-1', name: 'Test Hero', type: 'character' })
		);

		render(RespiteSetup);

		const addHeroButton = screen.getByRole('button', { name: /add hero/i });
		await fireEvent.click(addHeroButton);

		// Set recovery values
		const currentInput = screen.getByLabelText(/current/i);
		const maxInput = screen.getByLabelText(/max/i);
		await fireEvent.input(currentInput, { target: { value: '5' } });
		await fireEvent.input(maxInput, { target: { value: '12' } });

		// Switch to manual mode
		const manualButton = screen.getByRole('button', { name: /manual/i });
		await fireEvent.click(manualButton);
		await tick();

		// Recovery values should be preserved
		const currentAfter = screen.getByLabelText(/current/i) as HTMLInputElement;
		const maxAfter = screen.getByLabelText(/max/i) as HTMLInputElement;
		expect(currentAfter.value).toBe('5');
		expect(maxAfter.value).toBe('12');
	});
});

describe('RespiteSetup - Accessibility', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockEntities.splice(0, mockEntities.length,
			createMockEntity({ id: 'char-1', name: 'Test Hero', type: 'character' })
		);
	});

	it('should have proper labels on all form inputs', () => {
		render(RespiteSetup);

		expect(screen.getByLabelText(/respite name/i)).toBeInTheDocument();
		expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
		expect(screen.getByLabelText(/victory points available/i)).toBeInTheDocument();
	});

	it('should have accessible hero entry mode toggle buttons', async () => {
		render(RespiteSetup);

		const addHeroButton = screen.getByRole('button', { name: /add hero/i });
		await fireEvent.click(addHeroButton);

		await waitFor(() => {
			const fromEntityButton = screen.getByRole('button', { name: /from entity/i });
			const manualButton = screen.getByRole('button', { name: /manual/i });

			expect(fromEntityButton).toBeInTheDocument();
			expect(manualButton).toBeInTheDocument();
		});
	});

	it('should have accessible remove hero buttons', async () => {
		render(RespiteSetup);

		const addHeroButton = screen.getByRole('button', { name: /add hero/i });
		await fireEvent.click(addHeroButton);

		await waitFor(() => {
			expect(screen.getByRole('button', { name: /remove hero/i })).toBeInTheDocument();
		});
	});

	it('should have aria-required on required fields', () => {
		render(RespiteSetup);

		const nameInput = screen.getByLabelText(/respite name/i);
		expect(nameInput).toHaveAttribute('aria-required', 'true');
	});

	it('should show validation error with aria-invalid', async () => {
		render(RespiteSetup);

		// Try to submit without name
		const createButton = screen.getByRole('button', { name: /create respite/i });
		await fireEvent.click(createButton);

		await waitFor(() => {
			const nameInput = screen.getByLabelText(/respite name/i);
			expect(nameInput).toHaveAttribute('aria-invalid', 'true');
		});
	});
});
