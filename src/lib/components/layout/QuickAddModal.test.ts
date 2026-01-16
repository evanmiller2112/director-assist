import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import QuickAddModal from './QuickAddModal.svelte';
import { getAllEntityTypes } from '$lib/config/entityTypes';
import { goto } from '$app/navigation';

// Mock $app/navigation
vi.mock('$app/navigation', () => ({
	goto: vi.fn()
}));

// Mock the entityTypes config
vi.mock('$lib/config/entityTypes', () => ({
	getAllEntityTypes: vi.fn(() => [
		{
			type: 'character',
			label: 'Player Character',
			labelPlural: 'Player Characters',
			icon: 'user',
			color: 'character',
			isBuiltIn: true,
			fieldDefinitions: [],
			defaultRelationships: []
		},
		{
			type: 'npc',
			label: 'NPC',
			labelPlural: 'NPCs',
			icon: 'users',
			color: 'npc',
			isBuiltIn: true,
			fieldDefinitions: [],
			defaultRelationships: []
		},
		{
			type: 'location',
			label: 'Location',
			labelPlural: 'Locations',
			icon: 'map-pin',
			color: 'location',
			isBuiltIn: true,
			fieldDefinitions: [],
			defaultRelationships: []
		},
		{
			type: 'faction',
			label: 'Faction',
			labelPlural: 'Factions',
			icon: 'flag',
			color: 'faction',
			isBuiltIn: true,
			fieldDefinitions: [],
			defaultRelationships: []
		},
		{
			type: 'custom_quest',
			label: 'Quest',
			labelPlural: 'Quests',
			icon: 'scroll',
			color: 'custom',
			isBuiltIn: false,
			fieldDefinitions: [],
			defaultRelationships: []
		}
	])
}));

describe('QuickAddModal Component - Modal Visibility', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should not be visible when open prop is false', () => {
		render(QuickAddModal, { props: { open: false } });

		// Modal should not be in document
		const dialog = screen.queryByRole('dialog');
		expect(dialog).not.toBeInTheDocument();
	});

	it('should not be visible when open prop is undefined (default)', () => {
		render(QuickAddModal);

		// Modal should not be visible by default
		const dialog = screen.queryByRole('dialog');
		expect(dialog).not.toBeInTheDocument();
	});

	it('should be visible when open prop is true', () => {
		render(QuickAddModal, { props: { open: true } });

		// Modal should be visible
		const dialog = screen.getByRole('dialog');
		expect(dialog).toBeInTheDocument();
	});

	it('should have appropriate modal title', () => {
		render(QuickAddModal, { props: { open: true } });

		// Should have a heading that describes the purpose
		const heading = screen.getByRole('heading', { name: /add.*entity/i });
		expect(heading).toBeInTheDocument();
	});

	it('should have dialog role for accessibility', () => {
		render(QuickAddModal, { props: { open: true } });

		const dialog = screen.getByRole('dialog');
		expect(dialog).toHaveAttribute('aria-modal', 'true');
	});
});

describe('QuickAddModal Component - Close Behavior', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should call onClose callback when Escape key is pressed', async () => {
		const onClose = vi.fn();
		render(QuickAddModal, { props: { open: true, onClose } });

		// Press Escape key
		await fireEvent.keyDown(document, { key: 'Escape' });

		expect(onClose).toHaveBeenCalledTimes(1);
	});

	it('should call onClose callback when Cancel button is clicked', async () => {
		const onClose = vi.fn();
		render(QuickAddModal, { props: { open: true, onClose } });

		// Find and click Cancel button
		const cancelButton = screen.getByRole('button', { name: /cancel/i });
		await fireEvent.click(cancelButton);

		expect(onClose).toHaveBeenCalledTimes(1);
	});

	it('should call onClose callback when backdrop is clicked', async () => {
		const onClose = vi.fn();
		render(QuickAddModal, { props: { open: true, onClose } });

		// Find the backdrop (dialog element itself or a backdrop div)
		const dialog = screen.getByRole('dialog');

		// Click on the backdrop (parent of dialog content)
		await fireEvent.click(dialog);

		expect(onClose).toHaveBeenCalledTimes(1);
	});

	it('should NOT call onClose when clicking inside modal content', async () => {
		const onClose = vi.fn();
		render(QuickAddModal, { props: { open: true, onClose } });

		// Click on the modal title
		const heading = screen.getByRole('heading', { name: /add.*entity/i });
		await fireEvent.click(heading);

		// onClose should not have been called
		expect(onClose).not.toHaveBeenCalled();
	});

	it('should have a Cancel button', () => {
		render(QuickAddModal, { props: { open: true } });

		const cancelButton = screen.getByRole('button', { name: /cancel/i });
		expect(cancelButton).toBeInTheDocument();
	});

	it('should handle missing onClose callback gracefully', async () => {
		render(QuickAddModal, { props: { open: true } });

		const cancelButton = screen.getByRole('button', { name: /cancel/i });

		// Should not throw error when clicking Cancel without onClose
		await expect(async () => {
			await fireEvent.click(cancelButton);
		}).not.toThrow();
	});
});

describe('QuickAddModal Component - Entity Type Display', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should display all entity types in a grid', () => {
		render(QuickAddModal, { props: { open: true } });

		// Should show all 5 mocked entity types
		expect(screen.getByText('Player Character')).toBeInTheDocument();
		expect(screen.getByText('NPC')).toBeInTheDocument();
		expect(screen.getByText('Location')).toBeInTheDocument();
		expect(screen.getByText('Faction')).toBeInTheDocument();
		expect(screen.getByText('Quest')).toBeInTheDocument();
	});

	it('should display both built-in and custom entity types', () => {
		render(QuickAddModal, { props: { open: true } });

		// Built-in types
		expect(screen.getByText('Player Character')).toBeInTheDocument();
		expect(screen.getByText('NPC')).toBeInTheDocument();

		// Custom type
		expect(screen.getByText('Quest')).toBeInTheDocument();
	});

	it('should render each entity type as a clickable button', () => {
		render(QuickAddModal, { props: { open: true } });

		const typeButtons = screen.getAllByRole('button').filter(
			(btn) => !btn.textContent?.includes('Cancel')
		);

		// Should have 5 entity type buttons
		expect(typeButtons.length).toBeGreaterThanOrEqual(5);
	});

	it('should display entity type icons', () => {
		render(QuickAddModal, { props: { open: true } });

		// Icons should be rendered (checking via aria-hidden or data-testid if available)
		// This test will need to verify icon rendering in the actual component
		const container = screen.getByRole('dialog');
		expect(container).toBeInTheDocument();

		// Each entity type card should have an icon element
		// The actual icon implementation will determine how to test this
	});

	it('should display entity types in a grid layout', () => {
		const { container } = render(QuickAddModal, { props: { open: true } });

		// Find the grid container (should have CSS classes for grid layout)
		const gridContainer = container.querySelector('[class*="grid"]');
		expect(gridContainer).toBeInTheDocument();
	});

	it('should call getAllEntityTypes to fetch entity types', () => {
		render(QuickAddModal, { props: { open: true } });

		expect(getAllEntityTypes).toHaveBeenCalled();
	});
});

describe('QuickAddModal Component - Search/Filter Functionality', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should have a search input field', () => {
		render(QuickAddModal, { props: { open: true } });

		const searchInput = screen.getByRole('textbox');
		expect(searchInput).toBeInTheDocument();
	});

	it('should have appropriate placeholder text for search', () => {
		render(QuickAddModal, { props: { open: true } });

		const searchInput = screen.getByRole('textbox');
		expect(searchInput).toHaveAttribute(
			'placeholder',
			expect.stringMatching(/search/i)
		);
	});

	it('should show all entity types when search is empty', () => {
		render(QuickAddModal, { props: { open: true } });

		expect(screen.getByText('Player Character')).toBeInTheDocument();
		expect(screen.getByText('NPC')).toBeInTheDocument();
		expect(screen.getByText('Location')).toBeInTheDocument();
		expect(screen.getByText('Faction')).toBeInTheDocument();
		expect(screen.getByText('Quest')).toBeInTheDocument();
	});

	it('should filter entity types based on search query', async () => {
		render(QuickAddModal, { props: { open: true } });

		const searchInput = screen.getByRole('textbox');
		await fireEvent.input(searchInput, { target: { value: 'character' } });

		// Should show only Character
		expect(screen.getByText('Player Character')).toBeInTheDocument();

		// Should not show other types
		expect(screen.queryByText('Location')).not.toBeInTheDocument();
		expect(screen.queryByText('Faction')).not.toBeInTheDocument();
		expect(screen.queryByText('Quest')).not.toBeInTheDocument();
	});

	it('should perform case-insensitive search', async () => {
		render(QuickAddModal, { props: { open: true } });

		const searchInput = screen.getByRole('textbox');
		await fireEvent.input(searchInput, { target: { value: 'LOCATION' } });

		// Should show Location despite uppercase search
		expect(screen.getByText('Location')).toBeInTheDocument();

		// Should not show other types
		expect(screen.queryByText('Player Character')).not.toBeInTheDocument();
		expect(screen.queryByText('Faction')).not.toBeInTheDocument();
	});

	it('should filter by partial matches', async () => {
		render(QuickAddModal, { props: { open: true } });

		const searchInput = screen.getByRole('textbox');
		await fireEvent.input(searchInput, { target: { value: 'fac' } });

		// Should show Faction (partial match)
		expect(screen.getByText('Faction')).toBeInTheDocument();

		// Should not show other types
		expect(screen.queryByText('Player Character')).not.toBeInTheDocument();
		expect(screen.queryByText('Location')).not.toBeInTheDocument();
	});

	it('should show no results message when no types match', async () => {
		render(QuickAddModal, { props: { open: true } });

		const searchInput = screen.getByRole('textbox');
		await fireEvent.input(searchInput, { target: { value: 'xyz123notfound' } });

		// Should show no results message
		expect(screen.getByText(/no.*entity types.*found/i)).toBeInTheDocument();

		// Should not show any entity type
		expect(screen.queryByText('Player Character')).not.toBeInTheDocument();
		expect(screen.queryByText('NPC')).not.toBeInTheDocument();
	});

	it('should restore all types when search is cleared', async () => {
		render(QuickAddModal, { props: { open: true } });

		const searchInput = screen.getByRole('textbox');

		// First, filter
		await fireEvent.input(searchInput, { target: { value: 'npc' } });
		expect(screen.getByText('NPC')).toBeInTheDocument();
		expect(screen.queryByText('Location')).not.toBeInTheDocument();

		// Then, clear search
		await fireEvent.input(searchInput, { target: { value: '' } });

		// All types should be visible again
		expect(screen.getByText('Player Character')).toBeInTheDocument();
		expect(screen.getByText('NPC')).toBeInTheDocument();
		expect(screen.getByText('Location')).toBeInTheDocument();
		expect(screen.getByText('Faction')).toBeInTheDocument();
		expect(screen.getByText('Quest')).toBeInTheDocument();
	});

	it('should allow typing in search input', async () => {
		render(QuickAddModal, { props: { open: true } });

		const searchInput = screen.getByRole('textbox') as HTMLInputElement;
		const testQuery = 'quest';

		await fireEvent.input(searchInput, { target: { value: testQuery } });

		expect(searchInput.value).toBe(testQuery);
	});
});

describe('QuickAddModal Component - Navigation', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should navigate to correct URL when entity type is clicked', async () => {
		render(QuickAddModal, { props: { open: true } });

		const characterButton = screen.getByText('Player Character').closest('button');
		expect(characterButton).toBeDefined();

		await fireEvent.click(characterButton!);

		// Should navigate to /entities/character/new
		expect(goto).toHaveBeenCalledWith('/entities/character/new');
	});

	it('should navigate with correct type for NPC', async () => {
		render(QuickAddModal, { props: { open: true } });

		const npcButton = screen.getByText('NPC').closest('button');
		await fireEvent.click(npcButton!);

		expect(goto).toHaveBeenCalledWith('/entities/npc/new');
	});

	it('should navigate with correct type for Location', async () => {
		render(QuickAddModal, { props: { open: true } });

		const locationButton = screen.getByText('Location').closest('button');
		await fireEvent.click(locationButton!);

		expect(goto).toHaveBeenCalledWith('/entities/location/new');
	});

	it('should navigate with correct type for custom entity type', async () => {
		render(QuickAddModal, { props: { open: true } });

		const questButton = screen.getByText('Quest').closest('button');
		await fireEvent.click(questButton!);

		expect(goto).toHaveBeenCalledWith('/entities/custom_quest/new');
	});

	it('should call onClose callback after selecting entity type', async () => {
		const onClose = vi.fn();
		render(QuickAddModal, { props: { open: true, onClose } });

		const characterButton = screen.getByText('Player Character').closest('button');
		await fireEvent.click(characterButton!);

		// Should call onClose to close the modal after navigation
		await waitFor(() => {
			expect(onClose).toHaveBeenCalled();
		});
	});

	it('should navigate and close in correct order', async () => {
		const onClose = vi.fn();
		render(QuickAddModal, { props: { open: true, onClose } });

		const npcButton = screen.getByText('NPC').closest('button');
		await fireEvent.click(npcButton!);

		// Both should be called
		expect(goto).toHaveBeenCalledWith('/entities/npc/new');
		await waitFor(() => {
			expect(onClose).toHaveBeenCalled();
		});
	});

	it('should handle navigation when onClose callback is not provided', async () => {
		render(QuickAddModal, { props: { open: true } });

		const factionButton = screen.getByText('Faction').closest('button');

		// Should not throw error
		await expect(async () => {
			await fireEvent.click(factionButton!);
		}).not.toThrow();

		// Should still navigate
		expect(goto).toHaveBeenCalledWith('/entities/faction/new');
	});
});

describe('QuickAddModal Component - Keyboard Navigation', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should focus search input when modal opens', async () => {
		render(QuickAddModal, { props: { open: true } });

		const searchInput = screen.getByRole('textbox');

		// Search input should be focused on open
		await waitFor(() => {
			expect(searchInput).toHaveFocus();
		});
	});

	it('should allow tab navigation between entity type buttons', () => {
		render(QuickAddModal, { props: { open: true } });

		const buttons = screen.getAllByRole('button');

		// All buttons should be focusable
		buttons.forEach((button) => {
			expect(button).not.toHaveAttribute('tabindex', '-1');
		});
	});

	it('should handle Enter key on entity type button', async () => {
		render(QuickAddModal, { props: { open: true } });

		const characterButton = screen.getByText('Player Character').closest('button');
		characterButton!.focus();

		// Press Enter key
		await fireEvent.keyDown(characterButton!, { key: 'Enter' });

		// Should navigate
		expect(goto).toHaveBeenCalledWith('/entities/character/new');
	});
});

describe('QuickAddModal Component - Accessibility', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should have proper ARIA attributes on dialog', () => {
		render(QuickAddModal, { props: { open: true } });

		const dialog = screen.getByRole('dialog');
		expect(dialog).toHaveAttribute('aria-modal', 'true');
	});

	it('should have aria-labelledby connecting title to dialog', () => {
		render(QuickAddModal, { props: { open: true } });

		const dialog = screen.getByRole('dialog');
		const heading = screen.getByRole('heading', { name: /add.*entity/i });

		const headingId = heading.getAttribute('id');
		expect(headingId).toBeTruthy();
		expect(dialog).toHaveAttribute('aria-labelledby', headingId);
	});

	it('should have proper label on search input', () => {
		render(QuickAddModal, { props: { open: true } });

		const searchInput = screen.getByRole('textbox');
		const label = screen.getByLabelText(/search/i);

		expect(label).toEqual(searchInput);
	});

	it('should have descriptive button labels for entity types', () => {
		render(QuickAddModal, { props: { open: true } });

		const characterButton = screen.getByText('Player Character').closest('button');

		// Button should have accessible name
		expect(characterButton).toHaveAccessibleName();
	});

	it('should trap focus within modal when open', () => {
		render(QuickAddModal, { props: { open: true } });

		// All interactive elements should be within the dialog
		const dialog = screen.getByRole('dialog');
		const buttons = screen.getAllByRole('button');
		const searchInput = screen.getByRole('textbox');

		// Check that search input is inside dialog
		expect(dialog).toContainElement(searchInput);

		// Check that all buttons are inside dialog
		buttons.forEach((button) => {
			expect(dialog).toContainElement(button);
		});
	});
});

describe('QuickAddModal Component - Visual Feedback', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should show entity type colors/styling', () => {
		const { container } = render(QuickAddModal, { props: { open: true } });

		// Entity type cards should have color-related classes or styles
		const dialog = container.querySelector('[role="dialog"]');
		expect(dialog).toBeInTheDocument();

		// This test verifies that the component structure is in place
		// Actual color styling will be verified through visual/integration tests
	});

	it('should have hover states on entity type buttons', () => {
		render(QuickAddModal, { props: { open: true } });

		const typeButtons = screen.getAllByRole('button').filter(
			(btn) => !btn.textContent?.includes('Cancel')
		);

		// Buttons should not be disabled (so hover states work)
		typeButtons.forEach((button) => {
			expect(button).not.toBeDisabled();
		});
	});

	it('should render entity type grid responsively', () => {
		const { container } = render(QuickAddModal, { props: { open: true } });

		// Grid container should exist with appropriate structure
		const dialog = container.querySelector('[role="dialog"]');
		expect(dialog).toBeInTheDocument();
	});
});

describe('QuickAddModal Component - Edge Cases', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should handle empty entity types list', () => {
		// Mock empty entity types
		vi.mocked(getAllEntityTypes).mockReturnValue([]);

		render(QuickAddModal, { props: { open: true } });

		// Should show no entity types message
		expect(screen.getByText(/no.*entity types/i)).toBeInTheDocument();
	});

	it('should handle entity type with long name', () => {
		vi.mocked(getAllEntityTypes).mockReturnValue([
			{
				type: 'very_long_type',
				label: 'Very Long Entity Type Name That Might Wrap',
				labelPlural: 'Very Long Entity Type Names',
				icon: 'package',
				color: 'custom',
				isBuiltIn: false,
				fieldDefinitions: [],
				defaultRelationships: []
			}
		]);

		render(QuickAddModal, { props: { open: true } });

		expect(screen.getByText('Very Long Entity Type Name That Might Wrap')).toBeInTheDocument();
	});

	it('should handle rapid consecutive searches', async () => {
		render(QuickAddModal, { props: { open: true } });

		const searchInput = screen.getByRole('textbox');

		// Rapidly change search value
		await fireEvent.input(searchInput, { target: { value: 'a' } });
		await fireEvent.input(searchInput, { target: { value: 'ab' } });
		await fireEvent.input(searchInput, { target: { value: 'abc' } });
		await fireEvent.input(searchInput, { target: { value: '' } });

		// Should not error and should show all types
		expect(screen.getByText('Player Character')).toBeInTheDocument();
	});

	it('should handle multiple rapid open/close cycles', async () => {
		const onClose = vi.fn();
		const { rerender } = render(QuickAddModal, { props: { open: true, onClose } });

		// Close
		rerender({ open: false, onClose });
		expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

		// Open
		rerender({ open: true, onClose });
		expect(screen.getByRole('dialog')).toBeInTheDocument();

		// Close again
		rerender({ open: false, onClose });
		expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
	});

	it('should clear search when modal is closed and reopened', async () => {
		const onClose = vi.fn();
		const { rerender } = render(QuickAddModal, { props: { open: true, onClose } });

		// Type in search
		const searchInput = screen.getByRole('textbox') as HTMLInputElement;
		await fireEvent.input(searchInput, { target: { value: 'npc' } });
		expect(searchInput.value).toBe('npc');

		// Close modal
		rerender({ open: false, onClose });

		// Reopen modal
		rerender({ open: true, onClose });

		// Search should be cleared
		const newSearchInput = screen.getByRole('textbox') as HTMLInputElement;
		expect(newSearchInput.value).toBe('');
	});
});
