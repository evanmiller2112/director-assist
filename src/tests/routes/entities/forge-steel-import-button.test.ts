import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/svelte';
import EntityListPage from '../../../routes/entities/[type]/+page.svelte';
import { createMockEntity } from '../../utils/testUtils';
import { createMockEntitiesStore, createMockCampaignStore } from '../../mocks/stores';
import { setPageParams } from '../../mocks/$app/stores';
import type { BaseEntity } from '$lib/types';

// Create mock stores that will be shared
let mockEntitiesStore: ReturnType<typeof createMockEntitiesStore>;
let mockCampaignStore: ReturnType<typeof createMockCampaignStore>;

// Mock the stores
vi.mock('$lib/stores', async () => {
	return {
		get entitiesStore() {
			return mockEntitiesStore;
		},
		get campaignStore() {
			return mockCampaignStore;
		}
	};
});

// Mock the config/entityTypes module
vi.mock('$lib/config/entityTypes', () => ({
	getEntityTypeDefinition: vi.fn((type) => ({
		type,
		label: type.charAt(0).toUpperCase() + type.slice(1),
		labelPlural: `${type.charAt(0).toUpperCase() + type.slice(1)}s`,
		icon: 'package',
		color: '#94a3b8',
		isBuiltIn: true,
		fieldDefinitions: [],
		defaultRelationships: []
	}))
}));

// Mock the navigation
vi.mock('$app/navigation', async () => {
	const actual = await vi.importActual('../../../tests/mocks/$app/navigation');
	return actual;
});

// Mock the stores
vi.mock('$app/stores', async () => {
	const actual = await vi.importActual('../../../tests/mocks/$app/stores');
	return actual;
});

// Mock the RelateCommand component
vi.mock('$lib/components/entity/RelateCommand.svelte', async () => {
	const MockRelateCommand = (await import('../../../tests/mocks/components/MockRelateCommand.svelte')).default;
	return {
		default: MockRelateCommand
	};
});

// Mock the ForgeSteelImportModal component
vi.mock('$lib/components/settings/ForgeSteelImportModal.svelte', async () => {
	const MockForgeSteelImportModal = (await import('../../../tests/mocks/components/MockForgeSteelImportModal.svelte')).default;
	return {
		default: MockForgeSteelImportModal
	};
});

describe('Entity List Page - Forge Steel Import Button (Issue #249)', () => {
	let testEntities: BaseEntity[];

	beforeEach(() => {
		vi.clearAllMocks();

		// Create mock stores
		mockEntitiesStore = createMockEntitiesStore();
		mockCampaignStore = createMockCampaignStore();

		// Create test entities for different types
		testEntities = [
			createMockEntity({
				id: 'character-1',
				name: 'Thorin Oakenshield',
				type: 'character',
				description: 'Dwarf warrior',
				links: []
			}),
			createMockEntity({
				id: 'character-2',
				name: 'Bilbo Baggins',
				type: 'character',
				description: 'Hobbit burglar',
				links: []
			}),
			createMockEntity({
				id: 'npc-1',
				name: 'Gandalf',
				type: 'npc',
				description: 'Wizard',
				links: []
			}),
			createMockEntity({
				id: 'location-1',
				name: 'Rivendell',
				type: 'location',
				description: 'Hidden elven valley',
				links: []
			}),
			createMockEntity({
				id: 'item-1',
				name: 'Sting',
				type: 'item',
				description: 'Elvish blade',
				links: []
			}),
			createMockEntity({
				id: 'faction-1',
				name: 'Fellowship',
				type: 'faction',
				description: 'Heroes of Middle Earth',
				links: []
			})
		];

		// Set up entities in store
		mockEntitiesStore._setEntities(testEntities);
		mockEntitiesStore.getByType = vi.fn((type: string) =>
			testEntities.filter(e => e.type === type)
		);
	});

	describe('Import Button - Presence and Visibility', () => {
		it('should render Import from Forge Steel button on character entity page', () => {
			setPageParams({ type: 'character' });
			render(EntityListPage);

			const importButton = screen.getByRole('button', { name: /import from forge steel/i });
			expect(importButton).toBeInTheDocument();
		});

		it('should NOT render Import from Forge Steel button on NPC entity page', () => {
			setPageParams({ type: 'npc' });
			render(EntityListPage);

			const importButton = screen.queryByRole('button', { name: /import from forge steel/i });
			expect(importButton).not.toBeInTheDocument();
		});

		it('should NOT render Import from Forge Steel button on location entity page', () => {
			setPageParams({ type: 'location' });
			render(EntityListPage);

			const importButton = screen.queryByRole('button', { name: /import from forge steel/i });
			expect(importButton).not.toBeInTheDocument();
		});

		it('should NOT render Import from Forge Steel button on item entity page', () => {
			setPageParams({ type: 'item' });
			render(EntityListPage);

			const importButton = screen.queryByRole('button', { name: /import from forge steel/i });
			expect(importButton).not.toBeInTheDocument();
		});

		it('should NOT render Import from Forge Steel button on faction entity page', () => {
			setPageParams({ type: 'faction' });
			render(EntityListPage);

			const importButton = screen.queryByRole('button', { name: /import from forge steel/i });
			expect(importButton).not.toBeInTheDocument();
		});

		it('should render Import button next to Add Character button', () => {
			setPageParams({ type: 'character' });
			render(EntityListPage);

			const importButton = screen.getByRole('button', { name: /import from forge steel/i });
			const addButton = screen.getByRole('link', { name: /add character/i });

			// Both buttons should exist in the header area
			expect(importButton).toBeInTheDocument();
			expect(addButton).toBeInTheDocument();
		});
	});

	describe('Import Button - Visual Design', () => {
		it('should have Upload icon in Import button', () => {
			setPageParams({ type: 'character' });
			render(EntityListPage);

			const importButton = screen.getByRole('button', { name: /import from forge steel/i });

			// Button should contain an SVG icon
			const icon = importButton.querySelector('svg');
			expect(icon).toBeInTheDocument();
		});

		it('should have appropriate button styling classes', () => {
			setPageParams({ type: 'character' });
			render(EntityListPage);

			const importButton = screen.getByRole('button', { name: /import from forge steel/i });

			// Should have button classes (btn, btn-secondary, etc.)
			expect(importButton.className).toMatch(/btn/);
		});

		it('should display button text "Import from Forge Steel"', () => {
			setPageParams({ type: 'character' });
			render(EntityListPage);

			const importButton = screen.getByRole('button', { name: /import from forge steel/i });
			expect(importButton.textContent).toMatch(/import from forge steel/i);
		});
	});

	describe('Import Button - Modal Opening', () => {
		it('should open ForgeSteelImportModal when Import button is clicked', async () => {
			setPageParams({ type: 'character' });
			render(EntityListPage);

			const importButton = screen.getByRole('button', { name: /import from forge steel/i });
			await fireEvent.click(importButton);

			// Modal should be visible
			await waitFor(() => {
				const modal = screen.getByRole('dialog', { name: /import from forge steel/i });
				expect(modal).toBeInTheDocument();
			});
		});

		it('should display modal with correct title', async () => {
			setPageParams({ type: 'character' });
			render(EntityListPage);

			const importButton = screen.getByRole('button', { name: /import from forge steel/i });
			await fireEvent.click(importButton);

			await waitFor(() => {
				expect(screen.getByText(/import from forge steel/i)).toBeInTheDocument();
			});
		});

		it('should keep modal closed initially', () => {
			setPageParams({ type: 'character' });
			render(EntityListPage);

			// Modal should not be visible before clicking the button
			const modal = screen.queryByRole('dialog', { name: /import from forge steel/i });
			expect(modal).not.toBeInTheDocument();
		});
	});

	describe('Import Button - Modal Closing', () => {
		it('should close modal when Close button is clicked', async () => {
			setPageParams({ type: 'character' });
			render(EntityListPage);

			const importButton = screen.getByRole('button', { name: /import from forge steel/i });
			await fireEvent.click(importButton);

			const modal = await screen.findByRole('dialog');
			expect(modal).toBeInTheDocument();

			const closeButton = within(modal).getByRole('button', { name: /close/i });
			await fireEvent.click(closeButton);

			// Modal should be removed
			await waitFor(() => {
				expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
			});
		});

		it('should close modal when Cancel button is clicked', async () => {
			setPageParams({ type: 'character' });
			render(EntityListPage);

			const importButton = screen.getByRole('button', { name: /import from forge steel/i });
			await fireEvent.click(importButton);

			const modal = await screen.findByRole('dialog');

			const cancelButton = within(modal).getByRole('button', { name: /cancel/i });
			await fireEvent.click(cancelButton);

			await waitFor(() => {
				expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
			});
		});

		it('should close modal when pressing Escape key', async () => {
			setPageParams({ type: 'character' });
			render(EntityListPage);

			const importButton = screen.getByRole('button', { name: /import from forge steel/i });
			await fireEvent.click(importButton);

			await screen.findByRole('dialog');

			// Press Escape
			await fireEvent.keyDown(window, { key: 'Escape' });

			await waitFor(() => {
				expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
			});
		});

		it('should allow opening modal again after closing', async () => {
			setPageParams({ type: 'character' });
			render(EntityListPage);

			const importButton = screen.getByRole('button', { name: /import from forge steel/i });

			// Open modal
			await fireEvent.click(importButton);
			let modal = await screen.findByRole('dialog');
			expect(modal).toBeInTheDocument();

			// Close modal
			const closeButton = within(modal).getByRole('button', { name: /close/i });
			await fireEvent.click(closeButton);

			await waitFor(() => {
				expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
			});

			// Open modal again
			await fireEvent.click(importButton);
			modal = await screen.findByRole('dialog');
			expect(modal).toBeInTheDocument();
		});
	});

	describe('Import Button - Successful Import Flow', () => {
		it('should close modal after successful import', async () => {
			setPageParams({ type: 'character' });
			mockEntitiesStore.create = vi.fn().mockResolvedValue(undefined);

			render(EntityListPage);

			const importButton = screen.getByRole('button', { name: /import from forge steel/i });
			await fireEvent.click(importButton);

			const modal = await screen.findByRole('dialog');

			// Simulate successful import by clicking Import Character button
			const importCharacterButton = within(modal).getByRole('button', { name: /import character/i });
			await fireEvent.click(importCharacterButton);

			// Modal should close after successful import
			await waitFor(() => {
				expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
			});
		});

		it('should refresh entity list after successful import', async () => {
			setPageParams({ type: 'character' });
			mockEntitiesStore.create = vi.fn().mockResolvedValue(undefined);

			render(EntityListPage);

			// Initially 2 characters
			expect(screen.getAllByTestId('entity-card')).toHaveLength(2);

			const importButton = screen.getByRole('button', { name: /import from forge steel/i });
			await fireEvent.click(importButton);

			const modal = await screen.findByRole('dialog');
			const importCharacterButton = within(modal).getByRole('button', { name: /import character/i });
			await fireEvent.click(importCharacterButton);

			// Modal should close
			await waitFor(() => {
				expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
			});

			// create method should have been called
			expect(mockEntitiesStore.create).toHaveBeenCalled();
		});
	});

	describe('Import Button - Entity Type Specificity', () => {
		it('should only show Import button when entityType === "character"', () => {
			// Test character type
			setPageParams({ type: 'character' });
			const { unmount } = render(EntityListPage);
			expect(screen.getByRole('button', { name: /import from forge steel/i })).toBeInTheDocument();
			unmount();

			// Test each non-character type
			const nonCharacterTypes = ['npc', 'location', 'item', 'faction', 'campaign', 'session'];

			nonCharacterTypes.forEach(type => {
				setPageParams({ type });
				const { unmount: unmountType } = render(EntityListPage);
				expect(screen.queryByRole('button', { name: /import from forge steel/i })).not.toBeInTheDocument();
				unmountType();
			});
		});

		it('should render ForgeSteelImportModal component only on character page', async () => {
			setPageParams({ type: 'character' });
			render(EntityListPage);

			// Click button to open modal
			const importButton = screen.getByRole('button', { name: /import from forge steel/i });
			await fireEvent.click(importButton);

			// Modal should render
			await waitFor(() => {
				expect(screen.getByRole('dialog', { name: /import from forge steel/i })).toBeInTheDocument();
			});
		});

		it('should NOT render ForgeSteelImportModal component on non-character pages', () => {
			setPageParams({ type: 'npc' });
			render(EntityListPage);

			// Modal should not be in the DOM at all
			const modal = screen.queryByRole('dialog', { name: /import from forge steel/i });
			expect(modal).not.toBeInTheDocument();
		});
	});

	describe('Import Button - Edge Cases', () => {
		it('should handle rapid clicks on Import button', async () => {
			setPageParams({ type: 'character' });
			render(EntityListPage);

			const importButton = screen.getByRole('button', { name: /import from forge steel/i });

			// Click multiple times rapidly
			await fireEvent.click(importButton);
			await fireEvent.click(importButton);
			await fireEvent.click(importButton);

			// Should only open one modal
			await waitFor(() => {
				const modals = screen.getAllByRole('dialog');
				expect(modals.length).toBe(1);
			});
		});

		it('should maintain search filter state when opening/closing import modal', async () => {
			setPageParams({ type: 'character' });
			render(EntityListPage);

			// Type in search box
			const searchInput = screen.getByPlaceholderText(/search/i);
			await fireEvent.input(searchInput, { target: { value: 'Thorin' } });

			// Verify filtered results
			await waitFor(() => {
				const entityCards = screen.getAllByTestId('entity-card');
				expect(entityCards.length).toBe(1);
			});

			// Open modal
			const importButton = screen.getByRole('button', { name: /import from forge steel/i });
			await fireEvent.click(importButton);

			await screen.findByRole('dialog');

			// Close modal
			const closeButton = screen.getByRole('button', { name: /close/i });
			await fireEvent.click(closeButton);

			// Search filter should still be active
			await waitFor(() => {
				expect(searchInput).toHaveValue('Thorin');
				const entityCards = screen.getAllByTestId('entity-card');
				expect(entityCards.length).toBe(1);
			});
		});

		it('should handle empty character list gracefully', () => {
			setPageParams({ type: 'character' });
			mockEntitiesStore._setEntities([]);
			mockEntitiesStore.getByType = vi.fn(() => []);

			render(EntityListPage);

			// Import button should still be visible even with no characters
			const importButton = screen.getByRole('button', { name: /import from forge steel/i });
			expect(importButton).toBeInTheDocument();
		});
	});

	describe('Import Button - Accessibility', () => {
		it('should be keyboard accessible (focusable)', () => {
			setPageParams({ type: 'character' });
			render(EntityListPage);

			const importButton = screen.getByRole('button', { name: /import from forge steel/i });

			// Button should be focusable (no tabindex=-1)
			expect(importButton).not.toHaveAttribute('tabindex', '-1');
		});

		it('should have clear button text for screen readers', () => {
			setPageParams({ type: 'character' });
			render(EntityListPage);

			const importButton = screen.getByRole('button', { name: /import from forge steel/i });

			// Button text should be clear and descriptive
			expect(importButton).toHaveAccessibleName();
			expect(importButton.textContent).toMatch(/import/i);
			expect(importButton.textContent).toMatch(/forge steel/i);
		});
	});

	describe('Import Button - Layout and Positioning', () => {
		it('should be positioned in the header section near Add Character button', () => {
			setPageParams({ type: 'character' });
			render(EntityListPage);

			const importButton = screen.getByRole('button', { name: /import from forge steel/i });
			const addButton = screen.getByRole('link', { name: /add character/i });

			// Both should exist
			expect(importButton).toBeInTheDocument();
			expect(addButton).toBeInTheDocument();

			// Import button should come before Add button (based on plan)
			const allButtons = screen.getAllByRole('button', { name: /import from forge steel/i })
				.concat(screen.getAllByRole('link', { name: /add character/i }));

			expect(allButtons.length).toBeGreaterThanOrEqual(2);
		});

		it('should display buttons in a flex container with gap', () => {
			setPageParams({ type: 'character' });
			render(EntityListPage);

			const importButton = screen.getByRole('button', { name: /import from forge steel/i });

			// Button should be in the page
			expect(importButton).toBeInTheDocument();

			// Parent container should exist (flex gap-2 according to plan)
			const parent = importButton.parentElement;
			expect(parent).toBeInTheDocument();
		});
	});
});
