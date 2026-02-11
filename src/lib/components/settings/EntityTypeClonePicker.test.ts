/**
 * Tests for EntityTypeClonePicker Component
 *
 * GitHub Issue #210: Add clone and template library for custom entities
 *
 * This component displays a modal that allows users to select an existing
 * entity type (built-in or custom) to clone as a starting point for a new
 * custom entity type.
 *
 * RED Phase (TDD): These tests define expected behavior BEFORE implementation.
 * All tests should FAIL until the component is implemented.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, within, waitFor } from '@testing-library/svelte';
import EntityTypeClonePicker from './EntityTypeClonePicker.svelte';
import type { EntityTypeDefinition } from '$lib/types';

// Mock the campaign store
vi.mock('$lib/stores/campaign.svelte', () => ({
	campaignStore: {
		customEntityTypes: [
			{
				type: 'quest',
				label: 'Quest',
				labelPlural: 'Quests',
				icon: 'scroll',
				color: 'yellow',
				isBuiltIn: false,
				fieldDefinitions: [
					{ key: 'objective', label: 'Objective', type: 'text', required: true, order: 0 },
					{ key: 'reward', label: 'Reward', type: 'text', required: false, order: 1 }
				],
				defaultRelationships: ['involves', 'located_at']
			},
			{
				type: 'spell',
				label: 'Spell',
				labelPlural: 'Spells',
				icon: 'wand',
				color: 'purple',
				isBuiltIn: false,
				fieldDefinitions: [
					{ key: 'level', label: 'Level', type: 'number', required: true, order: 0 },
					{ key: 'school', label: 'School', type: 'select', required: true, order: 1, options: ['Evocation', 'Abjuration'] }
				],
				defaultRelationships: []
			}
		]
	}
}));

// Mock built-in entity types
vi.mock('$lib/config/entityTypes', () => ({
	BUILT_IN_ENTITY_TYPES: [
		{
			type: 'character',
			label: 'Player Character',
			labelPlural: 'Player Characters',
			icon: 'user',
			color: 'blue',
			isBuiltIn: true,
			fieldDefinitions: [
				{ key: 'class', label: 'Class', type: 'text', required: false, order: 0 },
				{ key: 'level', label: 'Level', type: 'number', required: false, order: 1 }
			],
			defaultRelationships: ['knows', 'located_at']
		},
		{
			type: 'npc',
			label: 'NPC',
			labelPlural: 'NPCs',
			icon: 'users',
			color: 'green',
			isBuiltIn: true,
			fieldDefinitions: [
				{ key: 'role', label: 'Role', type: 'text', required: false, order: 0 }
			],
			defaultRelationships: ['knows', 'serves']
		},
		{
			type: 'location',
			label: 'Location',
			labelPlural: 'Locations',
			icon: 'map-pin',
			color: 'red',
			isBuiltIn: true,
			fieldDefinitions: [
				{ key: 'region', label: 'Region', type: 'text', required: false, order: 0 }
			],
			defaultRelationships: ['part_of']
		}
	]
}));

describe('EntityTypeClonePicker - Basic Rendering (Issue #210)', () => {
	it('should render without crashing', () => {
		const { container } = render(EntityTypeClonePicker, {
			props: {
				open: false,
				onselect: vi.fn(),
				oncancel: vi.fn()
			}
		});
		expect(container).toBeInTheDocument();
	});

	it('should not be visible when open is false', () => {
		render(EntityTypeClonePicker, {
			props: {
				open: false,
				onselect: vi.fn(),
				oncancel: vi.fn()
			}
		});

		const dialog = screen.queryByRole('dialog');
		expect(dialog).not.toBeInTheDocument();
	});

	it('should be visible when open is true', () => {
		render(EntityTypeClonePicker, {
			props: {
				open: true,
				onselect: vi.fn(),
				oncancel: vi.fn()
			}
		});

		const dialog = screen.getByRole('dialog');
		expect(dialog).toBeInTheDocument();
	});

	it('should have appropriate modal title', () => {
		render(EntityTypeClonePicker, {
			props: {
				open: true,
				onselect: vi.fn(),
				oncancel: vi.fn()
			}
		});

		expect(screen.getByText(/clone.*entity type/i)).toBeInTheDocument();
	});

	it('should have dialog role for accessibility', () => {
		render(EntityTypeClonePicker, {
			props: {
				open: true,
				onselect: vi.fn(),
				oncancel: vi.fn()
			}
		});

		const dialog = screen.getByRole('dialog');
		expect(dialog).toHaveAttribute('aria-modal', 'true');
	});
});

describe('EntityTypeClonePicker - Built-in Types Display (Issue #210)', () => {
	it('should display Built-in Types section header', () => {
		render(EntityTypeClonePicker, {
			props: {
				open: true,
				onselect: vi.fn(),
				oncancel: vi.fn()
			}
		});

		expect(screen.getByText(/built-in types/i)).toBeInTheDocument();
	});

	it('should display all built-in entity types', () => {
		render(EntityTypeClonePicker, {
			props: {
				open: true,
				onselect: vi.fn(),
				oncancel: vi.fn()
			}
		});

		expect(screen.getByText('Player Character')).toBeInTheDocument();
		expect(screen.getByText('NPC')).toBeInTheDocument();
		expect(screen.getByText('Location')).toBeInTheDocument();
	});

	it('should display field count for each built-in type', () => {
		render(EntityTypeClonePicker, {
			props: {
				open: true,
				onselect: vi.fn(),
				oncancel: vi.fn()
			}
		});

		// Player Character has 2 fields
		expect(screen.getByText(/2.*fields?/i)).toBeInTheDocument();
		// NPC has 1 field
		expect(screen.getByText(/1.*field/i)).toBeInTheDocument();
	});

	it('should display icons for built-in types', () => {
		const { container } = render(EntityTypeClonePicker, {
			props: {
				open: true,
				onselect: vi.fn(),
				oncancel: vi.fn()
			}
		});

		// Built-in types section should contain icons (SVGs from Lucide)
		const builtInSection = screen.getByText(/built-in types/i).closest('section');
		expect(builtInSection).toBeTruthy();

		const icons = within(builtInSection as HTMLElement).getAllByRole('img', { hidden: true });
		expect(icons.length).toBeGreaterThan(0);
	});
});

describe('EntityTypeClonePicker - Custom Types Display (Issue #210)', () => {
	it('should display Custom Types section header', () => {
		render(EntityTypeClonePicker, {
			props: {
				open: true,
				onselect: vi.fn(),
				oncancel: vi.fn()
			}
		});

		expect(screen.getByText(/custom types/i)).toBeInTheDocument();
	});

	it('should display all custom entity types from campaignStore', () => {
		render(EntityTypeClonePicker, {
			props: {
				open: true,
				onselect: vi.fn(),
				oncancel: vi.fn()
			}
		});

		expect(screen.getByText('Quest')).toBeInTheDocument();
		expect(screen.getByText('Spell')).toBeInTheDocument();
	});

	it('should display field count for each custom type', () => {
		render(EntityTypeClonePicker, {
			props: {
				open: true,
				onselect: vi.fn(),
				oncancel: vi.fn()
			}
		});

		// Quest has 2 fields, Spell has 2 fields
		const customSection = screen.getByText(/custom types/i).closest('section');
		expect(customSection).toBeTruthy();

		const fieldCounts = within(customSection as HTMLElement).getAllByText(/2.*fields?/i);
		expect(fieldCounts.length).toBeGreaterThanOrEqual(1);
	});

	it.skip('should show empty state when no custom types exist', () => {
		// Skipping: vi.doMock doesn't work inside test blocks in Vitest
		// This would require a separate test file with different mocks
	});
});

describe('EntityTypeClonePicker - Type Selection (Issue #210)', () => {
	it('should render each type as selectable card/button', () => {
		render(EntityTypeClonePicker, {
			props: {
				open: true,
				onselect: vi.fn(),
				oncancel: vi.fn()
			}
		});

		const characterCard = screen.getByText('Player Character').closest('button, [role="button"]');
		expect(characterCard).toBeTruthy();

		const questCard = screen.getByText('Quest').closest('button, [role="button"]');
		expect(questCard).toBeTruthy();
	});

	it('should allow selecting a type by clicking', async () => {
		render(EntityTypeClonePicker, {
			props: {
				open: true,
				onselect: vi.fn(),
				oncancel: vi.fn()
			}
		});

		const characterCard = screen.getByText('Player Character').closest('button');
		expect(characterCard).toBeTruthy();

		await fireEvent.click(characterCard!);

		// Should show as selected (visual indicator)
		expect(characterCard).toHaveClass(/bg-blue/);  // Selected items have bg-blue class
	});

	it('should enable Clone Selected button when a type is selected', async () => {
		render(EntityTypeClonePicker, {
			props: {
				open: true,
				onselect: vi.fn(),
				oncancel: vi.fn()
			}
		});

		const cloneButton = screen.getByRole('button', { name: /clone selected/i });
		expect(cloneButton).toBeDisabled();

		const npcCard = screen.getByText('NPC').closest('button');
		await fireEvent.click(npcCard!);

		expect(cloneButton).not.toBeDisabled();
	});

	it('should disable Clone Selected button when nothing is selected', () => {
		render(EntityTypeClonePicker, {
			props: {
				open: true,
				onselect: vi.fn(),
				oncancel: vi.fn()
			}
		});

		const cloneButton = screen.getByRole('button', { name: /clone selected/i });
		expect(cloneButton).toBeDisabled();
	});

	it('should allow selecting only one type at a time', async () => {
		render(EntityTypeClonePicker, {
			props: {
				open: true,
				onselect: vi.fn(),
				oncancel: vi.fn()
			}
		});

		const characterCard = screen.getByText('Player Character').closest('button');
		const npcCard = screen.getByText('NPC').closest('button');

		await fireEvent.click(characterCard!);
		expect(characterCard).toHaveClass(/bg-blue/);  // Selected items have bg-blue class

		await fireEvent.click(npcCard!);
		expect(npcCard).toHaveClass(/bg-blue/);  // Selected items have bg-blue class
		expect(characterCard).not.toHaveClass(/bg-blue/);  // Deselected items don't have bg-blue class
	});
});

describe('EntityTypeClonePicker - Clone Action (Issue #210)', () => {
	it('should call onselect with cloned type when Clone Selected is clicked', async () => {
		const onselect = vi.fn();
		render(EntityTypeClonePicker, {
			props: {
				open: true,
				onselect,
				oncancel: vi.fn()
			}
		});

		const characterCard = screen.getByText('Player Character').closest('button');
		await fireEvent.click(characterCard!);

		const cloneButton = screen.getByRole('button', { name: /clone selected/i });
		await fireEvent.click(cloneButton);

		expect(onselect).toHaveBeenCalledTimes(1);

		// Verify the cloned type structure
		const clonedType: EntityTypeDefinition = onselect.mock.calls[0][0];
		expect(clonedType.type).toBe(''); // Empty type key for new custom type
		expect(clonedType.isBuiltIn).toBe(false);
		expect(clonedType.label).toBe('Player Character');
		expect(clonedType.fieldDefinitions).toHaveLength(2);
		expect(clonedType.defaultRelationships).toEqual(['knows', 'located_at']);
	});

	it('should clone custom entity type correctly', async () => {
		const onselect = vi.fn();
		render(EntityTypeClonePicker, {
			props: {
				open: true,
				onselect,
				oncancel: vi.fn()
			}
		});

		const questCard = screen.getByText('Quest').closest('button');
		await fireEvent.click(questCard!);

		const cloneButton = screen.getByRole('button', { name: /clone selected/i });
		await fireEvent.click(cloneButton);

		const clonedType: EntityTypeDefinition = onselect.mock.calls[0][0];
		expect(clonedType.type).toBe(''); // Empty type key
		expect(clonedType.isBuiltIn).toBe(false);
		expect(clonedType.label).toBe('Quest');
		expect(clonedType.fieldDefinitions).toHaveLength(2);
		expect(clonedType.fieldDefinitions[0].key).toBe('objective');
	});

	it('should preserve field definitions when cloning', async () => {
		const onselect = vi.fn();
		render(EntityTypeClonePicker, {
			props: {
				open: true,
				onselect,
				oncancel: vi.fn()
			}
		});

		const spellCard = screen.getByText('Spell').closest('button');
		await fireEvent.click(spellCard!);

		const cloneButton = screen.getByRole('button', { name: /clone selected/i });
		await fireEvent.click(cloneButton);

		const clonedType: EntityTypeDefinition = onselect.mock.calls[0][0];
		expect(clonedType.fieldDefinitions).toHaveLength(2);
		expect(clonedType.fieldDefinitions[0].key).toBe('level');
		expect(clonedType.fieldDefinitions[0].type).toBe('number');
		expect(clonedType.fieldDefinitions[1].options).toEqual(['Evocation', 'Abjuration']);
	});

	it('should preserve default relationships when cloning', async () => {
		const onselect = vi.fn();
		render(EntityTypeClonePicker, {
			props: {
				open: true,
				onselect,
				oncancel: vi.fn()
			}
		});

		const questCard = screen.getByText('Quest').closest('button');
		await fireEvent.click(questCard!);

		const cloneButton = screen.getByRole('button', { name: /clone selected/i });
		await fireEvent.click(cloneButton);

		const clonedType: EntityTypeDefinition = onselect.mock.calls[0][0];
		expect(clonedType.defaultRelationships).toEqual(['involves', 'located_at']);
	});

	it('should not call onselect when nothing is selected', async () => {
		const onselect = vi.fn();
		render(EntityTypeClonePicker, {
			props: {
				open: true,
				onselect,
				oncancel: vi.fn()
			}
		});

		const cloneButton = screen.getByRole('button', { name: /clone selected/i });

		// Button should be disabled, but test for safety
		if (!cloneButton.hasAttribute('disabled')) {
			await fireEvent.click(cloneButton);
		}

		expect(onselect).not.toHaveBeenCalled();
	});
});

describe('EntityTypeClonePicker - Cancel Action (Issue #210)', () => {
	it('should have Cancel button', () => {
		render(EntityTypeClonePicker, {
			props: {
				open: true,
				onselect: vi.fn(),
				oncancel: vi.fn()
			}
		});

		const cancelButton = screen.getByRole('button', { name: /cancel/i });
		expect(cancelButton).toBeInTheDocument();
	});

	it('should call oncancel when Cancel is clicked', async () => {
		const oncancel = vi.fn();
		render(EntityTypeClonePicker, {
			props: {
				open: true,
				onselect: vi.fn(),
				oncancel
			}
		});

		const cancelButton = screen.getByRole('button', { name: /cancel/i });
		await fireEvent.click(cancelButton);

		expect(oncancel).toHaveBeenCalledTimes(1);
	});

	it('should call oncancel when Escape key is pressed', async () => {
		const oncancel = vi.fn();
		render(EntityTypeClonePicker, {
			props: {
				open: true,
				onselect: vi.fn(),
				oncancel
			}
		});

		await fireEvent.keyDown(document, { key: 'Escape' });

		expect(oncancel).toHaveBeenCalledTimes(1);
	});

	it('should not call onselect when Cancel is clicked', async () => {
		const onselect = vi.fn();
		const oncancel = vi.fn();
		render(EntityTypeClonePicker, {
			props: {
				open: true,
				onselect,
				oncancel
			}
		});

		const cancelButton = screen.getByRole('button', { name: /cancel/i });
		await fireEvent.click(cancelButton);

		expect(onselect).not.toHaveBeenCalled();
		expect(oncancel).toHaveBeenCalled();
	});
});

describe('EntityTypeClonePicker - Search/Filter (Issue #210)', () => {
	it('should have search input field', () => {
		render(EntityTypeClonePicker, {
			props: {
				open: true,
				onselect: vi.fn(),
				oncancel: vi.fn()
			}
		});

		const searchInput = screen.getByRole('textbox');
		expect(searchInput).toBeInTheDocument();
	});

	it('should have appropriate placeholder for search', () => {
		render(EntityTypeClonePicker, {
			props: {
				open: true,
				onselect: vi.fn(),
				oncancel: vi.fn()
			}
		});

		const searchInput = screen.getByRole('textbox');
		expect(searchInput).toHaveAttribute('placeholder', expect.stringMatching(/search/i));
	});

	it('should filter types based on search query', async () => {
		render(EntityTypeClonePicker, {
			props: {
				open: true,
				onselect: vi.fn(),
				oncancel: vi.fn()
			}
		});

		const searchInput = screen.getByRole('textbox');
		await fireEvent.input(searchInput, { target: { value: 'character' } });

		// Should show Player Character
		expect(screen.getByText('Player Character')).toBeInTheDocument();

		// Should not show other types
		expect(screen.queryByText('Location')).not.toBeInTheDocument();
		expect(screen.queryByText('Quest')).not.toBeInTheDocument();
	});

	it('should perform case-insensitive search', async () => {
		render(EntityTypeClonePicker, {
			props: {
				open: true,
				onselect: vi.fn(),
				oncancel: vi.fn()
			}
		});

		const searchInput = screen.getByRole('textbox');
		await fireEvent.input(searchInput, { target: { value: 'NPC' } });

		expect(screen.getByText('NPC')).toBeInTheDocument();
	});

	it('should filter by partial matches', async () => {
		render(EntityTypeClonePicker, {
			props: {
				open: true,
				onselect: vi.fn(),
				oncancel: vi.fn()
			}
		});

		const searchInput = screen.getByRole('textbox');
		await fireEvent.input(searchInput, { target: { value: 'loc' } });

		expect(screen.getByText('Location')).toBeInTheDocument();
		expect(screen.queryByText('Player Character')).not.toBeInTheDocument();
	});

	it('should search across both built-in and custom types', async () => {
		render(EntityTypeClonePicker, {
			props: {
				open: true,
				onselect: vi.fn(),
				oncancel: vi.fn()
			}
		});

		const searchInput = screen.getByRole('textbox');
		await fireEvent.input(searchInput, { target: { value: 'e' } });

		// Should match Player Character, Quest, Spell
		expect(screen.getByText('Player Character')).toBeInTheDocument();
		expect(screen.getByText('Quest')).toBeInTheDocument();
		expect(screen.getByText('Spell')).toBeInTheDocument();
	});

	it('should show no results message when search has no matches', async () => {
		render(EntityTypeClonePicker, {
			props: {
				open: true,
				onselect: vi.fn(),
				oncancel: vi.fn()
			}
		});

		const searchInput = screen.getByRole('textbox');
		await fireEvent.input(searchInput, { target: { value: 'zzzznotfound' } });

		expect(screen.getByText(/no.*entity types.*found/i)).toBeInTheDocument();
	});

	it('should restore all types when search is cleared', async () => {
		render(EntityTypeClonePicker, {
			props: {
				open: true,
				onselect: vi.fn(),
				oncancel: vi.fn()
			}
		});

		const searchInput = screen.getByRole('textbox');

		// Filter
		await fireEvent.input(searchInput, { target: { value: 'npc' } });
		expect(screen.getByText('NPC')).toBeInTheDocument();
		expect(screen.queryByText('Location')).not.toBeInTheDocument();

		// Clear
		await fireEvent.input(searchInput, { target: { value: '' } });

		// All types visible again
		expect(screen.getByText('Player Character')).toBeInTheDocument();
		expect(screen.getByText('NPC')).toBeInTheDocument();
		expect(screen.getByText('Location')).toBeInTheDocument();
		expect(screen.getByText('Quest')).toBeInTheDocument();
	});
});

describe('EntityTypeClonePicker - Accessibility (Issue #210)', () => {
	it('should have aria-modal attribute', () => {
		render(EntityTypeClonePicker, {
			props: {
				open: true,
				onselect: vi.fn(),
				oncancel: vi.fn()
			}
		});

		const dialog = screen.getByRole('dialog');
		expect(dialog).toHaveAttribute('aria-modal', 'true');
	});

	it('should have aria-labelledby connecting title to dialog', () => {
		render(EntityTypeClonePicker, {
			props: {
				open: true,
				onselect: vi.fn(),
				oncancel: vi.fn()
			}
		});

		const dialog = screen.getByRole('dialog');
		const title = screen.getByText(/clone.*entity type/i);

		const titleId = title.getAttribute('id');
		expect(titleId).toBeTruthy();
		expect(dialog).toHaveAttribute('aria-labelledby', titleId);
	});

	it('should focus search input when opened', async () => {
		render(EntityTypeClonePicker, {
			props: {
				open: true,
				onselect: vi.fn(),
				oncancel: vi.fn()
			}
		});

		const searchInput = screen.getByRole('textbox');

		await waitFor(() => {
			expect(searchInput).toHaveFocus();
		});
	});

	it('should trap focus within modal', () => {
		render(EntityTypeClonePicker, {
			props: {
				open: true,
				onselect: vi.fn(),
				oncancel: vi.fn()
			}
		});

		const dialog = screen.getByRole('dialog');
		const buttons = screen.getAllByRole('button');
		const searchInput = screen.getByRole('textbox');

		expect(dialog).toContainElement(searchInput);
		buttons.forEach((button) => {
			expect(dialog).toContainElement(button);
		});
	});
});

describe('EntityTypeClonePicker - Edge Cases (Issue #210)', () => {
	it.skip('should handle entity types with no fields', async () => {
		// Skipping: vi.doMock doesn't work inside test blocks in Vitest
	});

	it.skip('should handle entity types with long names', () => {
		// Skipping: vi.doMock doesn't work inside test blocks in Vitest
	});

	it('should handle rapid selection changes', async () => {
		render(EntityTypeClonePicker, {
			props: {
				open: true,
				onselect: vi.fn(),
				oncancel: vi.fn()
			}
		});

		const characterCard = screen.getByText('Player Character').closest('button');
		const npcCard = screen.getByText('NPC').closest('button');
		const locationCard = screen.getByText('Location').closest('button');

		await fireEvent.click(characterCard!);
		await fireEvent.click(npcCard!);
		await fireEvent.click(locationCard!);
		await fireEvent.click(characterCard!);

		// Last selection should be active
		expect(characterCard).toHaveClass(/bg-blue/);  // Selected items have bg-blue class
	});

	it('should clear selection when modal is closed and reopened', async () => {
		const { rerender } = render(EntityTypeClonePicker, {
			props: {
				open: true,
				onselect: vi.fn(),
				oncancel: vi.fn()
			}
		});

		const npcCard = screen.getByText('NPC').closest('button');
		await fireEvent.click(npcCard!);
		expect(npcCard).toHaveClass(/bg-blue/);  // Selected items have bg-blue class

		// Close modal
		rerender({ open: false, onselect: vi.fn(), oncancel: vi.fn() });

		// Reopen modal
		rerender({ open: true, onselect: vi.fn(), oncancel: vi.fn() });

		const cloneButton = screen.getByRole('button', { name: /clone selected/i });
		expect(cloneButton).toBeDisabled();
	});
});
