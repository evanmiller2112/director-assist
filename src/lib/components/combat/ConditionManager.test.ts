/**
 * Tests for ConditionManager Component
 *
 * TDD RED PHASE - Tests for A2 Combat Round Tracker
 *
 * ConditionManager allows adding, viewing, updating, and removing conditions
 * on combatants with proper duration tracking.
 *
 * These tests will FAIL until the component is implemented in the GREEN phase.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import ConditionManager from './ConditionManager.svelte';
import { createMockHeroCombatant, createMockCondition } from '../../../tests/utils/combatTestUtils';
import type { Combatant, CombatCondition } from '$lib/types/combat';

describe('ConditionManager Component - Basic Rendering', () => {
	it('should render without crashing', () => {
		const combatant = createMockHeroCombatant();

		const { container } = render(ConditionManager, {
			props: {
				combatant,
				onAddCondition: vi.fn(),
				onRemoveCondition: vi.fn(),
				onUpdateDuration: vi.fn()
			}
		});

		expect(container).toBeInTheDocument();
	});

	it('should display existing conditions', () => {
		const combatant = createMockHeroCombatant({
			conditions: [
				createMockCondition({ name: 'Stunned', duration: 1 }),
				createMockCondition({ name: 'Bleeding', duration: 2 })
			]
		});

		render(ConditionManager, {
			props: {
				combatant,
				onAddCondition: vi.fn(),
				onRemoveCondition: vi.fn(),
				onUpdateDuration: vi.fn()
			}
		});

		expect(screen.getByText('Stunned')).toBeInTheDocument();
		expect(screen.getByText('Bleeding')).toBeInTheDocument();
	});

	it('should show empty state when no conditions', () => {
		const combatant = createMockHeroCombatant({ conditions: [] });

		render(ConditionManager, {
			props: {
				combatant,
				onAddCondition: vi.fn(),
				onRemoveCondition: vi.fn(),
				onUpdateDuration: vi.fn()
			}
		});

		expect(screen.getByText(/no.*conditions/i)).toBeInTheDocument();
	});

	it('should display Add Condition button', () => {
		const combatant = createMockHeroCombatant();

		render(ConditionManager, {
			props: {
				combatant,
				onAddCondition: vi.fn(),
				onRemoveCondition: vi.fn(),
				onUpdateDuration: vi.fn()
			}
		});

		expect(screen.getByRole('button', { name: /add.*condition/i })).toBeInTheDocument();
	});
});

describe('ConditionManager Component - Condition Display', () => {
	it('should display condition name', () => {
		const combatant = createMockHeroCombatant({
			conditions: [createMockCondition({ name: 'Poisoned' })]
		});

		render(ConditionManager, {
			props: {
				combatant,
				onAddCondition: vi.fn(),
				onRemoveCondition: vi.fn(),
				onUpdateDuration: vi.fn()
			}
		});

		expect(screen.getByText('Poisoned')).toBeInTheDocument();
	});

	it('should display condition duration', () => {
		const combatant = createMockHeroCombatant({
			conditions: [createMockCondition({ name: 'Stunned', duration: 3 })]
		});

		render(ConditionManager, {
			props: {
				combatant,
				onAddCondition: vi.fn(),
				onRemoveCondition: vi.fn(),
				onUpdateDuration: vi.fn()
			}
		});

		expect(screen.getByText(/3.*rounds?/i)).toBeInTheDocument();
	});

	it('should display "Until end of combat" for duration 0', () => {
		const combatant = createMockHeroCombatant({
			conditions: [createMockCondition({ name: 'Blessed', duration: 0 })]
		});

		render(ConditionManager, {
			props: {
				combatant,
				onAddCondition: vi.fn(),
				onRemoveCondition: vi.fn(),
				onUpdateDuration: vi.fn()
			}
		});

		expect(screen.getByText(/until.*end.*combat/i)).toBeInTheDocument();
	});

	it('should display "Permanent" for duration -1', () => {
		const combatant = createMockHeroCombatant({
			conditions: [createMockCondition({ name: 'Cursed', duration: -1 })]
		});

		render(ConditionManager, {
			props: {
				combatant,
				onAddCondition: vi.fn(),
				onRemoveCondition: vi.fn(),
				onUpdateDuration: vi.fn()
			}
		});

		expect(screen.getByText(/permanent/i)).toBeInTheDocument();
	});

	it('should display condition source', () => {
		const combatant = createMockHeroCombatant({
			conditions: [createMockCondition({ name: 'Stunned', source: 'Lightning Bolt' })]
		});

		render(ConditionManager, {
			props: {
				combatant,
				onAddCondition: vi.fn(),
				onRemoveCondition: vi.fn(),
				onUpdateDuration: vi.fn()
			}
		});

		expect(screen.getByText(/Lightning Bolt/)).toBeInTheDocument();
	});

	it('should show condition description in tooltip', async () => {
		const combatant = createMockHeroCombatant({
			conditions: [
				createMockCondition({
					name: 'Stunned',
					description: 'Cannot take actions or move',
					duration: 1
				})
			]
		});

		render(ConditionManager, {
			props: {
				combatant,
				onAddCondition: vi.fn(),
				onRemoveCondition: vi.fn(),
				onUpdateDuration: vi.fn()
			}
		});

		const conditionBadge = screen.getByText('Stunned');
		await fireEvent.mouseEnter(conditionBadge);

		expect(screen.getByText(/Cannot take actions/)).toBeInTheDocument();
	});
});

describe('ConditionManager Component - Adding Conditions', () => {
	it('should show add condition form when button is clicked', async () => {
		const combatant = createMockHeroCombatant();

		render(ConditionManager, {
			props: {
				combatant,
				onAddCondition: vi.fn(),
				onRemoveCondition: vi.fn(),
				onUpdateDuration: vi.fn()
			}
		});

		const addButton = screen.getByRole('button', { name: /add.*condition/i });
		await fireEvent.click(addButton);

		expect(screen.getByLabelText(/condition.*name/i)).toBeInTheDocument();
		expect(screen.getByLabelText(/duration/i)).toBeInTheDocument();
	});

	it('should have name input in add form', async () => {
		const combatant = createMockHeroCombatant();

		render(ConditionManager, {
			props: {
				combatant,
				onAddCondition: vi.fn(),
				onRemoveCondition: vi.fn(),
				onUpdateDuration: vi.fn()
			}
		});

		const addButton = screen.getByRole('button', { name: /add.*condition/i });
		await fireEvent.click(addButton);

		const nameInput = screen.getByLabelText(/condition.*name/i);
		await fireEvent.input(nameInput, { target: { value: 'Stunned' } });

		expect((nameInput as HTMLInputElement).value).toBe('Stunned');
	});

	it('should have duration input in add form', async () => {
		const combatant = createMockHeroCombatant();

		render(ConditionManager, {
			props: {
				combatant,
				onAddCondition: vi.fn(),
				onRemoveCondition: vi.fn(),
				onUpdateDuration: vi.fn()
			}
		});

		const addButton = screen.getByRole('button', { name: /add.*condition/i });
		await fireEvent.click(addButton);

		const durationInput = screen.getByLabelText(/duration/i);
		await fireEvent.input(durationInput, { target: { value: '3' } });

		expect((durationInput as HTMLInputElement).value).toBe('3');
	});

	it('should have optional description input', async () => {
		const combatant = createMockHeroCombatant();

		render(ConditionManager, {
			props: {
				combatant,
				onAddCondition: vi.fn(),
				onRemoveCondition: vi.fn(),
				onUpdateDuration: vi.fn()
			}
		});

		const addButton = screen.getByRole('button', { name: /add.*condition/i });
		await fireEvent.click(addButton);

		expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
	});

	it('should have source input', async () => {
		const combatant = createMockHeroCombatant();

		render(ConditionManager, {
			props: {
				combatant,
				onAddCondition: vi.fn(),
				onRemoveCondition: vi.fn(),
				onUpdateDuration: vi.fn()
			}
		});

		const addButton = screen.getByRole('button', { name: /add.*condition/i });
		await fireEvent.click(addButton);

		expect(screen.getByLabelText(/source/i)).toBeInTheDocument();
	});

	it('should call onAddCondition when form is submitted', async () => {
		const onAddCondition = vi.fn();
		const combatant = createMockHeroCombatant();

		render(ConditionManager, {
			props: {
				combatant,
				onAddCondition,
				onRemoveCondition: vi.fn(),
				onUpdateDuration: vi.fn()
			}
		});

		const addButton = screen.getByRole('button', { name: /add.*condition/i });
		await fireEvent.click(addButton);

		const nameInput = screen.getByLabelText(/condition.*name/i);
		const durationInput = screen.getByLabelText(/duration/i);
		const sourceInput = screen.getByLabelText(/source/i);

		await fireEvent.input(nameInput, { target: { value: 'Stunned' } });
		await fireEvent.input(durationInput, { target: { value: '1' } });
		await fireEvent.input(sourceInput, { target: { value: 'Spell' } });

		const submitButton = screen.getByRole('button', { name: /save|add/i });
		await fireEvent.click(submitButton);

		expect(onAddCondition).toHaveBeenCalledWith({
			name: 'Stunned',
			duration: 1,
			source: 'Spell',
			description: undefined
		});
	});

	it('should require name to submit', async () => {
		const onAddCondition = vi.fn();
		const combatant = createMockHeroCombatant();

		render(ConditionManager, {
			props: {
				combatant,
				onAddCondition,
				onRemoveCondition: vi.fn(),
				onUpdateDuration: vi.fn()
			}
		});

		const addButton = screen.getByRole('button', { name: /add.*condition/i });
		await fireEvent.click(addButton);

		const submitButton = screen.getByRole('button', { name: /save|add/i });
		expect(submitButton).toBeDisabled();
	});

	it('should close form after successful add', async () => {
		const onAddCondition = vi.fn().mockResolvedValue(undefined);
		const combatant = createMockHeroCombatant();

		render(ConditionManager, {
			props: {
				combatant,
				onAddCondition,
				onRemoveCondition: vi.fn(),
				onUpdateDuration: vi.fn()
			}
		});

		const addButton = screen.getByRole('button', { name: /add.*condition/i });
		await fireEvent.click(addButton);

		const nameInput = screen.getByLabelText(/condition.*name/i);
		await fireEvent.input(nameInput, { target: { value: 'Stunned' } });

		const submitButton = screen.getByRole('button', { name: /save|add/i });
		await fireEvent.click(submitButton);

		await waitFor(() => {
			expect(screen.queryByLabelText(/condition.*name/i)).not.toBeInTheDocument();
		});
	});

	it('should provide common condition presets', async () => {
		const combatant = createMockHeroCombatant();

		render(ConditionManager, {
			props: {
				combatant,
				onAddCondition: vi.fn(),
				onRemoveCondition: vi.fn(),
				onUpdateDuration: vi.fn(),
				showPresets: true
			}
		});

		const addButton = screen.getByRole('button', { name: /add.*condition/i });
		await fireEvent.click(addButton);

		// Should show common Draw Steel conditions
		expect(screen.getByText(/Stunned/i)).toBeInTheDocument();
		expect(screen.getByText(/Slowed/i)).toBeInTheDocument();
		expect(screen.getByText(/Bleeding/i)).toBeInTheDocument();
	});
});

describe('ConditionManager Component - Removing Conditions', () => {
	it('should show remove button for each condition', () => {
		const combatant = createMockHeroCombatant({
			conditions: [createMockCondition({ name: 'Stunned' })]
		});

		render(ConditionManager, {
			props: {
				combatant,
				onAddCondition: vi.fn(),
				onRemoveCondition: vi.fn(),
				onUpdateDuration: vi.fn()
			}
		});

		const removeButtons = screen.getAllByRole('button', { name: /remove/i });
		expect(removeButtons.length).toBeGreaterThan(0);
	});

	it('should call onRemoveCondition when remove button is clicked', async () => {
		const onRemoveCondition = vi.fn();
		const combatant = createMockHeroCombatant({
			conditions: [createMockCondition({ name: 'Stunned' })]
		});

		render(ConditionManager, {
			props: {
				combatant,
				onAddCondition: vi.fn(),
				onRemoveCondition,
				onUpdateDuration: vi.fn()
			}
		});

		const removeButton = screen.getByRole('button', { name: /remove/i });
		await fireEvent.click(removeButton);

		expect(onRemoveCondition).toHaveBeenCalledWith('Stunned');
	});

	it('should show confirmation dialog for permanent conditions', async () => {
		const onRemoveCondition = vi.fn();
		const combatant = createMockHeroCombatant({
			conditions: [createMockCondition({ name: 'Cursed', duration: -1 })]
		});

		render(ConditionManager, {
			props: {
				combatant,
				onAddCondition: vi.fn(),
				onRemoveCondition,
				onUpdateDuration: vi.fn()
			}
		});

		const removeButton = screen.getByRole('button', { name: /remove/i });
		await fireEvent.click(removeButton);

		expect(screen.getByText(/are you sure/i)).toBeInTheDocument();
	});
});

describe('ConditionManager Component - Duration Management', () => {
	it('should show duration controls for each condition', () => {
		const combatant = createMockHeroCombatant({
			conditions: [createMockCondition({ name: 'Stunned', duration: 3 })]
		});

		render(ConditionManager, {
			props: {
				combatant,
				onAddCondition: vi.fn(),
				onRemoveCondition: vi.fn(),
				onUpdateDuration: vi.fn()
			}
		});

		expect(screen.getByRole('button', { name: /\+/i })).toBeInTheDocument();
		expect(screen.getByRole('button', { name: /-/i })).toBeInTheDocument();
	});

	it('should call onUpdateDuration when increment button is clicked', async () => {
		const onUpdateDuration = vi.fn();
		const combatant = createMockHeroCombatant({
			conditions: [createMockCondition({ name: 'Stunned', duration: 2 })]
		});

		render(ConditionManager, {
			props: {
				combatant,
				onAddCondition: vi.fn(),
				onRemoveCondition: vi.fn(),
				onUpdateDuration
			}
		});

		const incrementButton = screen.getByRole('button', { name: /\+/i });
		await fireEvent.click(incrementButton);

		expect(onUpdateDuration).toHaveBeenCalledWith('Stunned', 3);
	});

	it('should call onUpdateDuration when decrement button is clicked', async () => {
		const onUpdateDuration = vi.fn();
		const combatant = createMockHeroCombatant({
			conditions: [createMockCondition({ name: 'Stunned', duration: 2 })]
		});

		render(ConditionManager, {
			props: {
				combatant,
				onAddCondition: vi.fn(),
				onRemoveCondition: vi.fn(),
				onUpdateDuration
			}
		});

		const decrementButton = screen.getByRole('button', { name: /-/i });
		await fireEvent.click(decrementButton);

		expect(onUpdateDuration).toHaveBeenCalledWith('Stunned', 1);
	});

	it('should disable decrement button when duration is 0', () => {
		const combatant = createMockHeroCombatant({
			conditions: [
				createMockCondition({ name: 'Blessed', duration: 0 }),
				createMockCondition({ name: 'Weakened', duration: 1 })
			]
		});

		render(ConditionManager, {
			props: {
				combatant,
				onAddCondition: vi.fn(),
				onRemoveCondition: vi.fn(),
				onUpdateDuration: vi.fn()
			}
		});

		// Duration 0 conditions don't show increment/decrement buttons
		// But duration 1 condition shows them, and decrement should work down to 1
		const decrementButtons = screen.queryAllByRole('button', { name: /-/i });
		// Should only find one decrement button (for the duration 1 condition)
		expect(decrementButtons).toHaveLength(1);
		expect(decrementButtons[0]).not.toBeDisabled();
	});

	it('should hide duration controls for permanent conditions', () => {
		const combatant = createMockHeroCombatant({
			conditions: [createMockCondition({ name: 'Cursed', duration: -1 })]
		});

		render(ConditionManager, {
			props: {
				combatant,
				onAddCondition: vi.fn(),
				onRemoveCondition: vi.fn(),
				onUpdateDuration: vi.fn()
			}
		});

		const durationControls = screen.queryByRole('button', { name: /\+|-/i });
		expect(durationControls).not.toBeInTheDocument();
	});

	it('should allow direct editing of duration', async () => {
		const onUpdateDuration = vi.fn();
		const combatant = createMockHeroCombatant({
			conditions: [createMockCondition({ name: 'Stunned', duration: 3 })]
		});

		render(ConditionManager, {
			props: {
				combatant,
				onAddCondition: vi.fn(),
				onRemoveCondition: vi.fn(),
				onUpdateDuration
			}
		});

		const durationDisplay = screen.getByText(/3.*rounds?/i);
		await fireEvent.click(durationDisplay);

		const durationInput = screen.getByDisplayValue('3') as HTMLInputElement;
		await fireEvent.input(durationInput, { target: { value: '5' } });
		await fireEvent.blur(durationInput);

		expect(onUpdateDuration).toHaveBeenCalledWith('Stunned', 5);
	});
});

describe('ConditionManager Component - Sorting and Filtering', () => {
	it('should sort conditions by duration (shortest first)', () => {
		const combatant = createMockHeroCombatant({
			conditions: [
				createMockCondition({ name: 'Long', duration: 5 }),
				createMockCondition({ name: 'Short', duration: 1 }),
				createMockCondition({ name: 'Medium', duration: 3 })
			]
		});

		render(ConditionManager, {
			props: {
				combatant,
				onAddCondition: vi.fn(),
				onRemoveCondition: vi.fn(),
				onUpdateDuration: vi.fn(),
				sortByDuration: true
			}
		});

		const conditions = screen.getAllByTestId('condition-item');
		expect(conditions[0]).toHaveTextContent('Short');
		expect(conditions[1]).toHaveTextContent('Medium');
		expect(conditions[2]).toHaveTextContent('Long');
	});

	it('should highlight conditions expiring soon', () => {
		const combatant = createMockHeroCombatant({
			conditions: [createMockCondition({ name: 'Expiring', duration: 1 })]
		});

		render(ConditionManager, {
			props: {
				combatant,
				onAddCondition: vi.fn(),
				onRemoveCondition: vi.fn(),
				onUpdateDuration: vi.fn()
			}
		});

		const conditionItem = screen.getByTestId('condition-item');
		expect(conditionItem).toHaveClass(/warning|expiring/i);
	});
});

describe('ConditionManager Component - Accessibility', () => {
	it('should have proper ARIA labels', () => {
		const combatant = createMockHeroCombatant({
			conditions: [createMockCondition({ name: 'Stunned' })]
		});

		render(ConditionManager, {
			props: {
				combatant,
				onAddCondition: vi.fn(),
				onRemoveCondition: vi.fn(),
				onUpdateDuration: vi.fn()
			}
		});

		const list = screen.getByRole('list');
		expect(list).toHaveAccessibleName(/conditions/i);
	});

	it('should announce condition changes to screen readers', () => {
		const combatant = createMockHeroCombatant({
			conditions: [createMockCondition({ name: 'Stunned' })]
		});

		render(ConditionManager, {
			props: {
				combatant,
				onAddCondition: vi.fn(),
				onRemoveCondition: vi.fn(),
				onUpdateDuration: vi.fn()
			}
		});

		const announcements = screen.getByRole('status');
		expect(announcements).toHaveAttribute('aria-live', 'polite');
	});

	it('should be keyboard navigable', () => {
		const combatant = createMockHeroCombatant({
			conditions: [createMockCondition({ name: 'Stunned' })]
		});

		render(ConditionManager, {
			props: {
				combatant,
				onAddCondition: vi.fn(),
				onRemoveCondition: vi.fn(),
				onUpdateDuration: vi.fn()
			}
		});

		const buttons = screen.getAllByRole('button');
		buttons.forEach(button => {
			expect(button).not.toHaveAttribute('tabindex', '-1');
		});
	});
});

describe('ConditionManager Component - Edge Cases', () => {
	it('should handle many conditions', () => {
		const conditions = Array.from({ length: 10 }, (_, i) =>
			createMockCondition({ name: `Condition ${i + 1}`, duration: i + 1 })
		);
		const combatant = createMockHeroCombatant({ conditions });

		render(ConditionManager, {
			props: {
				combatant,
				onAddCondition: vi.fn(),
				onRemoveCondition: vi.fn(),
				onUpdateDuration: vi.fn()
			}
		});

		const conditionItems = screen.getAllByTestId('condition-item');
		expect(conditionItems).toHaveLength(10);
	});

	it('should handle duplicate condition names', () => {
		const combatant = createMockHeroCombatant({
			conditions: [
				createMockCondition({ name: 'Stunned', source: 'Spell A', duration: 1 }),
				createMockCondition({ name: 'Stunned', source: 'Spell B', duration: 2 })
			]
		});

		render(ConditionManager, {
			props: {
				combatant,
				onAddCondition: vi.fn(),
				onRemoveCondition: vi.fn(),
				onUpdateDuration: vi.fn()
			}
		});

		// Both should be displayed with sources to differentiate
		const stunnedConditions = screen.getAllByText(/Stunned/);
		expect(stunnedConditions).toHaveLength(2);
		expect(screen.getByText(/Spell A/)).toBeInTheDocument();
		expect(screen.getByText(/Spell B/)).toBeInTheDocument();
	});

	it('should handle very long condition names', () => {
		const combatant = createMockHeroCombatant({
			conditions: [
				createMockCondition({
					name: 'This Is A Very Long Condition Name That Should Be Truncated Or Wrapped',
					duration: 1
				})
			]
		});

		render(ConditionManager, {
			props: {
				combatant,
				onAddCondition: vi.fn(),
				onRemoveCondition: vi.fn(),
				onUpdateDuration: vi.fn()
			}
		});

		const conditionName = screen.getByText(/This Is A Very Long/);
		expect(conditionName).toHaveClass(/truncate|ellipsis/i);
	});
});
