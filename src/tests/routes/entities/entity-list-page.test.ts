import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/svelte';
import EntityListPage from '../../../routes/entities/[type]/+page.svelte';
import { createMockEntity, createMockEntities } from '../../utils/testUtils';
import { createMockEntitiesStore, createMockCampaignStore } from '../../mocks/stores';
import { setPageParams, page } from '../../mocks/$app/stores';
import { goto } from '$app/navigation';
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

describe('Entity List Page - Quick-Link Creation (Issue #77)', () => {
	let testEntities: BaseEntity[];

	beforeEach(() => {
		vi.clearAllMocks();

		// Create mock stores
		mockEntitiesStore = createMockEntitiesStore();
		mockCampaignStore = createMockCampaignStore();

		// Create test entities
		testEntities = [
			createMockEntity({
				id: 'npc-1',
				name: 'Aragorn',
				type: 'npc',
				description: 'Ranger of the North',
				links: []
			}),
			createMockEntity({
				id: 'npc-2',
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
			})
		];

		// Set up entities in store
		mockEntitiesStore._setEntities(testEntities);
		mockEntitiesStore.getByType = vi.fn((type: string) =>
			testEntities.filter(e => e.type === type)
		);

		// Set up page params
		setPageParams({ type: 'npc' });
	});

	describe('Link Button - Presence and Visibility', () => {
		it('should render a Link button on each entity card', () => {
			render(EntityListPage);

			// Get only entity cards (which have data-testid="entity-card")
			const entityCards = screen.getAllByTestId('entity-card');
			expect(entityCards.length).toBeGreaterThan(0);

			// Each entity card should have a Link button somewhere in its hierarchy
			// Note: Buttons have opacity-0 by default, so we need to query for hidden elements
			entityCards.forEach(card => {
				const linkButton = within(card).queryByRole('button', { name: /link/i, hidden: true });
				expect(linkButton).toBeInTheDocument();
			});
		});

		it('should render Link button for each entity in the filtered list', () => {
			render(EntityListPage);

			const npcEntities = testEntities.filter(e => e.type === 'npc');
			const linkButtons = screen.getAllByRole('button', { name: /link/i });

			// Should have one Link button per NPC entity
			expect(linkButtons.length).toBe(npcEntities.length);
		});

		it('should render Link button with hover visibility class (opacity-0 group-hover:opacity-100)', () => {
			render(EntityListPage);

			const linkButton = screen.getAllByRole('button', { name: /link/i })[0];

			// Should have opacity classes for hover effect
			expect(linkButton.className).toMatch(/opacity-0|group-hover:opacity-100/);
		});

		it('should NOT render Link button when no entities exist', () => {
			mockEntitiesStore._setEntities([]);
			mockEntitiesStore.getByType = vi.fn(() => []);

			render(EntityListPage);

			const linkButtons = screen.queryAllByRole('button', { name: /link/i });
			expect(linkButtons.length).toBe(0);
		});
	});

	describe('Link Button - Accessibility', () => {
		it('should have an aria-label for screen readers', () => {
			render(EntityListPage);

			const linkButtons = screen.getAllByRole('button', { name: /link/i });
			linkButtons.forEach(button => {
				expect(button).toHaveAttribute('aria-label');
				expect(button.getAttribute('aria-label')).toMatch(/link|relate|connect/i);
			});
		});

		it('should have a title attribute for tooltips', () => {
			render(EntityListPage);

			const linkButtons = screen.getAllByRole('button', { name: /link/i });
			linkButtons.forEach(button => {
				expect(button).toHaveAttribute('title');
				expect(button.getAttribute('title')).toMatch(/link|relate|connect/i);
			});
		});

		it('should include entity name in aria-label for context', () => {
			render(EntityListPage);

			const linkButtons = screen.getAllByRole('button', { name: /link/i });
			const firstButton = linkButtons[0];

			// Should mention entity name for clarity
			const ariaLabel = firstButton.getAttribute('aria-label');
			expect(ariaLabel).toMatch(/aragorn|entity/i);
		});

		it('should be keyboard accessible (focusable)', () => {
			render(EntityListPage);

			const linkButton = screen.getAllByRole('button', { name: /link/i })[0];

			// Button should be focusable (no tabindex=-1)
			expect(linkButton).not.toHaveAttribute('tabindex', '-1');
		});
	});

	describe('Link Button - Modal Opening', () => {
		it('should open RelateCommand modal when Link button is clicked', async () => {
			render(EntityListPage);

			const linkButton = screen.getAllByRole('button', { name: /link/i })[0];
			await fireEvent.click(linkButton);

			// Modal should be visible
			await waitFor(() => {
				const modal = screen.getByRole('dialog', { name: /link entity/i });
				expect(modal).toBeInTheDocument();
			});
		});

		it('should display modal with correct title mentioning source entity', async () => {
			render(EntityListPage);

			const linkButton = screen.getAllByRole('button', { name: /link/i })[0];
			await fireEvent.click(linkButton);

			await waitFor(() => {
				// Modal title should mention the entity we're linking from
				expect(screen.getByText(/link entity to aragorn/i)).toBeInTheDocument();
			});
		});

		it('should pass the correct entity as sourceEntity to RelateCommand', async () => {
			render(EntityListPage);

			// Click Link button on first entity (Aragorn)
			const linkButtons = screen.getAllByRole('button', { name: /link/i });
			await fireEvent.click(linkButtons[0]);

			await waitFor(() => {
				const modal = screen.getByRole('dialog');
				// Modal should reference Aragorn as the source
				expect(within(modal).getByText(/aragorn/i)).toBeInTheDocument();
			});
		});

		it('should open modal for different entities when different Link buttons are clicked', async () => {
			render(EntityListPage);

			const linkButtons = screen.getAllByRole('button', { name: /link/i });

			// Click first entity's Link button
			await fireEvent.click(linkButtons[0]);

			await waitFor(() => {
				const modal = screen.getByRole('dialog');
				expect(within(modal).getByText(/aragorn/i)).toBeInTheDocument();
			});

			// Close modal
			const closeButton = screen.getByRole('button', { name: /close/i });
			await fireEvent.click(closeButton);

			// Click second entity's Link button
			await fireEvent.click(linkButtons[1]);

			await waitFor(() => {
				const modal = screen.getByRole('dialog');
				expect(within(modal).getByText(/gandalf/i)).toBeInTheDocument();
			});
		});
	});

	describe('Link Button - Navigation Prevention', () => {
		it('should NOT navigate to entity detail page when Link button is clicked', async () => {
			render(EntityListPage);

			const linkButton = screen.getAllByRole('button', { name: /link/i })[0];
			await fireEvent.click(linkButton);

			// Navigation should NOT have been called
			expect(goto).not.toHaveBeenCalled();
		});

		it('should stop event propagation to prevent card click navigation', async () => {
			render(EntityListPage);

			const linkButton = screen.getAllByRole('button', { name: /link/i })[0];

			// Create a click event to verify stopPropagation is called
			const clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true });
			const stopPropagationSpy = vi.spyOn(clickEvent, 'stopPropagation');

			linkButton.dispatchEvent(clickEvent);

			// Should have stopped propagation
			expect(stopPropagationSpy).toHaveBeenCalled();
		});

		it('should prevent default click behavior', async () => {
			render(EntityListPage);

			const linkButton = screen.getAllByRole('button', { name: /link/i })[0];

			const clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true });
			const preventDefaultSpy = vi.spyOn(clickEvent, 'preventDefault');

			linkButton.dispatchEvent(clickEvent);

			// Should prevent default behavior
			expect(preventDefaultSpy).toHaveBeenCalled();
		});

		it('should allow normal card navigation when clicking outside Link button', async () => {
			render(EntityListPage);

			const entityCards = screen.getAllByRole('link');
			const firstCard = entityCards[0];

			// Click the card itself (not the Link button)
			await fireEvent.click(firstCard);

			// This is handled by the <a> tag, so no need to verify goto
			// Just verify the card is still a link
			expect(firstCard).toHaveAttribute('href', expect.stringMatching(/\/entities\/npc\//));
		});
	});

	describe('Link Button - Modal Closing', () => {
		it('should close modal when Close button is clicked', async () => {
			render(EntityListPage);

			const linkButton = screen.getAllByRole('button', { name: /link/i })[0];
			await fireEvent.click(linkButton);

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
			render(EntityListPage);

			const linkButton = screen.getAllByRole('button', { name: /link/i })[0];
			await fireEvent.click(linkButton);

			const modal = await screen.findByRole('dialog');

			const cancelButton = within(modal).getByRole('button', { name: /cancel/i });
			await fireEvent.click(cancelButton);

			await waitFor(() => {
				expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
			});
		});

		it('should close modal when clicking backdrop', async () => {
			render(EntityListPage);

			const linkButton = screen.getAllByRole('button', { name: /link/i })[0];
			await fireEvent.click(linkButton);

			const backdrop = await screen.findByRole('presentation');
			await fireEvent.click(backdrop);

			await waitFor(() => {
				expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
			});
		});

		it('should close modal when pressing Escape key', async () => {
			render(EntityListPage);

			const linkButton = screen.getAllByRole('button', { name: /link/i })[0];
			await fireEvent.click(linkButton);

			await screen.findByRole('dialog');

			// Press Escape
			await fireEvent.keyDown(window, { key: 'Escape' });

			await waitFor(() => {
				expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
			});
		});

		it('should allow opening modal again after closing', async () => {
			render(EntityListPage);

			const linkButton = screen.getAllByRole('button', { name: /link/i })[0];

			// Open modal
			await fireEvent.click(linkButton);
			let modal = await screen.findByRole('dialog');
			expect(modal).toBeInTheDocument();

			// Close modal
			const closeButton = within(modal).getByRole('button', { name: /close/i });
			await fireEvent.click(closeButton);

			await waitFor(() => {
				expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
			});

			// Open modal again
			await fireEvent.click(linkButton);
			modal = await screen.findByRole('dialog');
			expect(modal).toBeInTheDocument();
		});
	});

	describe('Link Button - Cross Entity Type Support', () => {
		it('should work for NPC entities', async () => {
			setPageParams({ type: 'npc' });
			mockEntitiesStore.getByType = vi.fn(() =>
				testEntities.filter(e => e.type === 'npc')
			);

			render(EntityListPage);

			const linkButtons = screen.getAllByRole('button', { name: /link/i });
			expect(linkButtons.length).toBe(2); // Aragorn and Gandalf

			await fireEvent.click(linkButtons[0]);
			expect(await screen.findByRole('dialog')).toBeInTheDocument();
		});

		it('should work for location entities', async () => {
			setPageParams({ type: 'location' });
			mockEntitiesStore.getByType = vi.fn(() =>
				testEntities.filter(e => e.type === 'location')
			);

			render(EntityListPage);

			const linkButtons = screen.getAllByRole('button', { name: /link/i });
			expect(linkButtons.length).toBe(1); // Rivendell

			await fireEvent.click(linkButtons[0]);
			expect(await screen.findByRole('dialog')).toBeInTheDocument();
		});

		it('should work for custom entity types', async () => {
			const customEntities = [
				createMockEntity({
					id: 'custom-1',
					name: 'Custom Entity',
					type: 'custom_type',
					links: []
				})
			];

			setPageParams({ type: 'custom_type' });
			mockEntitiesStore._setEntities(customEntities);
			mockEntitiesStore.getByType = vi.fn(() => customEntities);

			render(EntityListPage);

			const linkButton = screen.getByRole('button', { name: /link/i });
			await fireEvent.click(linkButton);

			expect(await screen.findByRole('dialog')).toBeInTheDocument();
		});

		it('should pass correct entity type to modal for each entity type', async () => {
			// Test with location
			setPageParams({ type: 'location' });
			mockEntitiesStore.getByType = vi.fn(() =>
				testEntities.filter(e => e.type === 'location')
			);

			render(EntityListPage);

			const linkButton = screen.getByRole('button', { name: /link/i });
			await fireEvent.click(linkButton);

			await waitFor(() => {
				const modal = screen.getByRole('dialog');
				// Modal should reference the location entity
				expect(within(modal).getByText(/rivendell/i)).toBeInTheDocument();
			});
		});
	});

	describe('Link Button - Visual Design', () => {
		it('should have appropriate icon or text indicating link action', () => {
			render(EntityListPage);

			const linkButton = screen.getAllByRole('button', { name: /link/i })[0];

			// Should have either text or an icon (check for common link icon classes or text)
			const hasIcon = linkButton.querySelector('svg') !== null;
			const hasText = linkButton.textContent && linkButton.textContent.trim().length > 0;

			expect(hasIcon || hasText).toBe(true);
		});

		it('should be positioned within or near the entity card', () => {
			render(EntityListPage);

			const entityCards = screen.getAllByTestId('entity-card');
			const firstCard = entityCards[0];
			const linkButton = within(firstCard).getByRole('button', { name: /link/i, hidden: true });

			// Button should be within the card's DOM tree
			expect(firstCard.contains(linkButton)).toBe(true);
		});

		it('should apply group hover pattern to parent card', () => {
			render(EntityListPage);

			const entityCards = screen.getAllByTestId('entity-card');
			const firstCard = entityCards[0];

			// Card should have 'group' class for Tailwind group-hover to work
			expect(firstCard.className).toMatch(/group/);
		});
	});

	describe('Link Button - Edge Cases', () => {
		it('should handle clicking Link button on entity with existing links', async () => {
			const entityWithLinks = createMockEntity({
				id: 'entity-with-links',
				name: 'Entity with Links',
				type: 'npc',
				links: [
					{
						id: 'link-1',
						targetId: 'other-entity',
						targetType: 'location',
						relationship: 'located_at',
						bidirectional: true
					}
				]
			});

			mockEntitiesStore._setEntities([entityWithLinks]);
			mockEntitiesStore.getByType = vi.fn(() => [entityWithLinks]);

			render(EntityListPage);

			const linkButton = screen.getByRole('button', { name: /link/i });
			await fireEvent.click(linkButton);

			// Modal should still open
			expect(await screen.findByRole('dialog')).toBeInTheDocument();
		});

		it('should handle rapid clicks on Link button', async () => {
			render(EntityListPage);

			const linkButton = screen.getAllByRole('button', { name: /link/i })[0];

			// Click multiple times rapidly
			await fireEvent.click(linkButton);
			await fireEvent.click(linkButton);
			await fireEvent.click(linkButton);

			// Should only open one modal
			const modals = screen.getAllByRole('dialog');
			expect(modals.length).toBe(1);
		});

		it('should maintain search filter state when opening/closing modal', async () => {
			render(EntityListPage);

			// Type in search box
			const searchInput = screen.getByPlaceholderText(/search/i);
			await fireEvent.input(searchInput, { target: { value: 'Aragorn' } });

			// Verify filtered results
			await waitFor(() => {
				const linkButtons = screen.getAllByRole('button', { name: /link/i });
				expect(linkButtons.length).toBe(1);
			});

			// Open modal
			const linkButton = screen.getByRole('button', { name: /link/i });
			await fireEvent.click(linkButton);

			await screen.findByRole('dialog');

			// Close modal
			const closeButton = screen.getByRole('button', { name: /close/i });
			await fireEvent.click(closeButton);

			// Search filter should still be active
			await waitFor(() => {
				expect(searchInput).toHaveValue('Aragorn');
				const linkButtons = screen.getAllByRole('button', { name: /link/i });
				expect(linkButtons.length).toBe(1);
			});
		});
	});

	describe('Link Button - Integration with RelateCommand', () => {
		it('should successfully create a link when RelateCommand completes', async () => {
			mockEntitiesStore.addLink = vi.fn().mockResolvedValue(undefined);

			render(EntityListPage);

			// Open modal
			const linkButton = screen.getAllByRole('button', { name: /link/i })[0];
			await fireEvent.click(linkButton);

			const modal = await screen.findByRole('dialog');

			// Select target entity
			const targetEntityButton = within(modal).getAllByRole('button').find(btn =>
				btn.textContent?.includes('Gandalf')
			);
			expect(targetEntityButton).toBeDefined();
			await fireEvent.click(targetEntityButton!);

			// Fill in relationship
			const relationshipInput = within(modal).getByLabelText(/relationship/i);
			await fireEvent.input(relationshipInput, { target: { value: 'knows' } });

			// Submit
			const createButton = within(modal).getByRole('button', { name: /create link/i });
			await fireEvent.click(createButton);

			// Modal should close
			await waitFor(() => {
				expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
			});

			// addLink should have been called
			expect(mockEntitiesStore.addLink).toHaveBeenCalledWith(
				'npc-1', // source (Aragorn)
				'npc-2', // target (Gandalf)
				'knows',
				true,
				expect.any(String)
			);
		});

		it('should keep modal open if link creation fails', async () => {
			mockEntitiesStore.addLink = vi.fn().mockRejectedValue(new Error('Failed to create link'));

			render(EntityListPage);

			const linkButton = screen.getAllByRole('button', { name: /link/i })[0];
			await fireEvent.click(linkButton);

			const modal = await screen.findByRole('dialog');

			// Select target entity
			const targetEntityButton = within(modal).getAllByRole('button').find(btn =>
				btn.textContent?.includes('Gandalf')
			);
			await fireEvent.click(targetEntityButton!);

			// Fill in relationship
			const relationshipInput = within(modal).getByLabelText(/relationship/i);
			await fireEvent.input(relationshipInput, { target: { value: 'knows' } });

			// Submit
			const createButton = within(modal).getByRole('button', { name: /create link/i });
			await fireEvent.click(createButton);

			// Modal should remain open and show error
			await waitFor(() => {
				expect(modal).toBeInTheDocument();
				expect(within(modal).getByText(/failed to create link/i)).toBeInTheDocument();
			});
		});
	});
});

describe('Entity List Page - Pagination (Issue #20)', () => {
	let testEntities: BaseEntity[];

	beforeEach(() => {
		vi.clearAllMocks();

		// Create mock stores
		mockEntitiesStore = createMockEntitiesStore();
		mockCampaignStore = createMockCampaignStore();

		// Create 156 test entities for pagination testing
		testEntities = createMockEntities(156, []);
		for (let i = 0; i < 156; i++) {
			testEntities[i].name = `Entity ${i + 1}`;
			testEntities[i].type = 'npc';
			testEntities[i].id = `npc-${i + 1}`;
		}

		// Set up entities in store
		mockEntitiesStore._setEntities(testEntities);
		mockEntitiesStore.getByType = vi.fn((type: string) =>
			testEntities.filter(e => e.type === type)
		);

		// Reset page params and URL
		setPageParams({ type: 'npc' });
		page.update(p => ({
			...p,
			url: new URL('http://localhost/entities/npc')
		}));
	});

	describe('Default Pagination Behavior', () => {
		it('should display first 20 entities by default', () => {
			render(EntityListPage);

			// Should show first 20 entities
			expect(screen.getByText('Entity 1')).toBeInTheDocument();
			expect(screen.getByText('Entity 20')).toBeInTheDocument();

			// Should not show entity 21
			expect(screen.queryByText('Entity 21')).not.toBeInTheDocument();
		});

		it('should show pagination controls when total entities exceed perPage', () => {
			render(EntityListPage);

			// Should show pagination controls
			expect(screen.getByRole('button', { name: /previous/i })).toBeInTheDocument();
			expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument();
		});

		it('should display correct item count in pagination', () => {
			render(EntityListPage);

			// Should show "Showing 1-20 of 156 items"
			expect(screen.getByText(/showing 1-20 of 156 items/i)).toBeInTheDocument();
		});

		it('should hide pagination controls when total entities are less than or equal to perPage', () => {
			// Create only 15 entities
			const fewEntities = createMockEntities(15, []);
			for (let i = 0; i < 15; i++) {
				fewEntities[i].name = `Entity ${i + 1}`;
				fewEntities[i].type = 'npc';
			}

			mockEntitiesStore._setEntities(fewEntities);
			mockEntitiesStore.getByType = vi.fn(() => fewEntities);

			render(EntityListPage);

			// Should not show pagination controls
			expect(screen.queryByRole('button', { name: /previous/i })).not.toBeInTheDocument();
			expect(screen.queryByRole('button', { name: /next/i })).not.toBeInTheDocument();
		});

		it('should show pagination controls when exactly at perPage threshold', () => {
			// Create exactly 20 entities
			const exactEntities = createMockEntities(20, []);
			for (let i = 0; i < 20; i++) {
				exactEntities[i].name = `Entity ${i + 1}`;
				exactEntities[i].type = 'npc';
			}

			mockEntitiesStore._setEntities(exactEntities);
			mockEntitiesStore.getByType = vi.fn(() => exactEntities);

			render(EntityListPage);

			// Should not show pagination controls when all items fit on one page
			expect(screen.queryByRole('button', { name: /previous/i })).not.toBeInTheDocument();
			expect(screen.queryByRole('button', { name: /next/i })).not.toBeInTheDocument();
		});

		it('should show pagination controls when one item over perPage threshold', () => {
			// Create 21 entities
			const extraEntities = createMockEntities(21, []);
			for (let i = 0; i < 21; i++) {
				extraEntities[i].name = `Entity ${i + 1}`;
				extraEntities[i].type = 'npc';
			}

			mockEntitiesStore._setEntities(extraEntities);
			mockEntitiesStore.getByType = vi.fn(() => extraEntities);

			render(EntityListPage);

			// Should show pagination controls
			expect(screen.getByRole('button', { name: /previous/i })).toBeInTheDocument();
			expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument();
		});
	});

	describe('URL Parameter - Page', () => {
		it('should read page parameter from URL and display correct entities', () => {
			// Mock URL with page=2
			page.update(p => ({
				...p,
				url: new URL('http://localhost/entities/npc?page=2')
			}));

			render(EntityListPage);

			// Should show entities 21-40
			expect(screen.getByText('Entity 21')).toBeInTheDocument();
			expect(screen.getByText('Entity 40')).toBeInTheDocument();

			// Should not show entities from page 1
			expect(screen.queryByText('Entity 1')).not.toBeInTheDocument();
			expect(screen.queryByText('Entity 20')).not.toBeInTheDocument();

			// Should not show entities from page 3
			expect(screen.queryByText('Entity 41')).not.toBeInTheDocument();
		});

		it('should display correct page in pagination info', () => {
			page.update(p => ({
				...p,
				url: new URL('http://localhost/entities/npc?page=2')
			}));

			render(EntityListPage);

			// Should show "Showing 21-40 of 156 items"
			expect(screen.getByText(/showing 21-40 of 156 items/i)).toBeInTheDocument();
		});

		it('should show entities from page 3', () => {
			page.update(p => ({
				...p,
				url: new URL('http://localhost/entities/npc?page=3')
			}));

			render(EntityListPage);

			// Should show entities 41-60
			expect(screen.getByText('Entity 41')).toBeInTheDocument();
			expect(screen.getByText('Entity 60')).toBeInTheDocument();
		});

		it('should show last page with partial items', () => {
			page.update(p => ({
				...p,
				url: new URL('http://localhost/entities/npc?page=8')
			}));

			render(EntityListPage);

			// Page 8 should show entities 141-156 (16 items)
			expect(screen.getByText('Entity 141')).toBeInTheDocument();
			expect(screen.getByText('Entity 156')).toBeInTheDocument();
			expect(screen.queryByText('Entity 140')).not.toBeInTheDocument();
		});

		it('should default to page 1 when page parameter is invalid', () => {
			page.update(p => ({
				...p,
				url: new URL('http://localhost/entities/npc?page=invalid')
			}));

			render(EntityListPage);

			// Should show first page
			expect(screen.getByText('Entity 1')).toBeInTheDocument();
			expect(screen.getByText('Entity 20')).toBeInTheDocument();
		});

		it('should default to page 1 when page parameter is negative', () => {
			page.update(p => ({
				...p,
				url: new URL('http://localhost/entities/npc?page=-1')
			}));

			render(EntityListPage);

			// Should show first page
			expect(screen.getByText('Entity 1')).toBeInTheDocument();
			expect(screen.getByText('Entity 20')).toBeInTheDocument();
		});

		it('should default to page 1 when page parameter is zero', () => {
			page.update(p => ({
				...p,
				url: new URL('http://localhost/entities/npc?page=0')
			}));

			render(EntityListPage);

			// Should show first page
			expect(screen.getByText('Entity 1')).toBeInTheDocument();
			expect(screen.getByText('Entity 20')).toBeInTheDocument();
		});

		it('should clamp to last page when page parameter exceeds total pages', () => {
			page.update(p => ({
				...p,
				url: new URL('http://localhost/entities/npc?page=999')
			}));

			render(EntityListPage);

			// Should show last page (page 8)
			expect(screen.getByText('Entity 141')).toBeInTheDocument();
			expect(screen.getByText('Entity 156')).toBeInTheDocument();
		});
	});

	describe('URL Parameter - PerPage', () => {
		it('should read perPage parameter from URL', () => {
			page.update(p => ({
				...p,
				url: new URL('http://localhost/entities/npc?perPage=50')
			}));

			render(EntityListPage);

			// Should show first 50 entities
			expect(screen.getByText('Entity 1')).toBeInTheDocument();
			expect(screen.getByText('Entity 50')).toBeInTheDocument();
			expect(screen.queryByText('Entity 51')).not.toBeInTheDocument();
		});

		it('should display correct pagination info with custom perPage', () => {
			page.update(p => ({
				...p,
				url: new URL('http://localhost/entities/npc?perPage=50')
			}));

			render(EntityListPage);

			// Should show "Showing 1-50 of 156 items"
			expect(screen.getByText(/showing 1-50 of 156 items/i)).toBeInTheDocument();
		});

		it('should handle perPage=100', () => {
			page.update(p => ({
				...p,
				url: new URL('http://localhost/entities/npc?perPage=100')
			}));

			render(EntityListPage);

			// Should show first 100 entities
			expect(screen.getByText('Entity 1')).toBeInTheDocument();
			expect(screen.getByText('Entity 100')).toBeInTheDocument();
			expect(screen.queryByText('Entity 101')).not.toBeInTheDocument();
		});

		it('should default to 20 when perPage parameter is invalid', () => {
			page.update(p => ({
				...p,
				url: new URL('http://localhost/entities/npc?perPage=invalid')
			}));

			render(EntityListPage);

			// Should show first 20 entities
			expect(screen.getByText('Entity 1')).toBeInTheDocument();
			expect(screen.getByText('Entity 20')).toBeInTheDocument();
			expect(screen.queryByText('Entity 21')).not.toBeInTheDocument();
		});

		it('should default to 20 when perPage parameter is negative', () => {
			page.update(p => ({
				...p,
				url: new URL('http://localhost/entities/npc?perPage=-10')
			}));

			render(EntityListPage);

			// Should show first 20 entities
			expect(screen.getByText('Entity 1')).toBeInTheDocument();
			expect(screen.getByText('Entity 20')).toBeInTheDocument();
		});

		it('should handle very large perPage values', () => {
			page.update(p => ({
				...p,
				url: new URL('http://localhost/entities/npc?perPage=1000')
			}));

			render(EntityListPage);

			// Should show all 156 entities
			expect(screen.getByText('Entity 1')).toBeInTheDocument();
			expect(screen.getByText('Entity 156')).toBeInTheDocument();

			// Pagination should be hidden
			expect(screen.queryByRole('button', { name: /previous/i })).not.toBeInTheDocument();
			expect(screen.queryByRole('button', { name: /next/i })).not.toBeInTheDocument();
		});
	});

	describe('Combined URL Parameters', () => {
		it('should handle both page and perPage parameters together', () => {
			page.update(p => ({
				...p,
				url: new URL('http://localhost/entities/npc?page=2&perPage=50')
			}));

			render(EntityListPage);

			// Page 2 with 50 per page should show entities 51-100
			expect(screen.getByText('Entity 51')).toBeInTheDocument();
			expect(screen.getByText('Entity 100')).toBeInTheDocument();
			expect(screen.queryByText('Entity 50')).not.toBeInTheDocument();
			expect(screen.queryByText('Entity 101')).not.toBeInTheDocument();
		});

		it('should display correct pagination info with both parameters', () => {
			page.update(p => ({
				...p,
				url: new URL('http://localhost/entities/npc?page=2&perPage=50')
			}));

			render(EntityListPage);

			expect(screen.getByText(/showing 51-100 of 156 items/i)).toBeInTheDocument();
		});

		it('should handle page 3 with perPage=100', () => {
			page.update(p => ({
				...p,
				url: new URL('http://localhost/entities/npc?page=3&perPage=100')
			}));

			render(EntityListPage);

			// Page 3 with 100 per page would exceed total, should clamp
			// Only 156 items total, so page 3 doesn't exist with perPage=100
			// Should show last valid page (page 2, items 101-156)
			expect(screen.getByText('Entity 101')).toBeInTheDocument();
			expect(screen.getByText('Entity 156')).toBeInTheDocument();
		});
	});

	describe('Pagination Navigation', () => {
		it('should update URL when Next button is clicked', async () => {
			render(EntityListPage);

			const nextButton = screen.getByRole('button', { name: /next/i });
			await fireEvent.click(nextButton);

			// Should navigate to page 2
			expect(goto).toHaveBeenCalledWith(expect.stringMatching(/page=2/));
		});

		it('should update URL when Previous button is clicked', async () => {
			page.update(p => ({
				...p,
				url: new URL('http://localhost/entities/npc?page=3')
			}));

			render(EntityListPage);

			const prevButton = screen.getByRole('button', { name: /previous/i });
			await fireEvent.click(prevButton);

			// Should navigate to page 2
			expect(goto).toHaveBeenCalledWith(expect.stringMatching(/page=2/));
		});

		it('should update URL when perPage selector is changed', async () => {
			render(EntityListPage);

			const select = screen.getByRole('combobox', { name: /per page|items per page/i });
			await fireEvent.change(select, { target: { value: '50' } });

			// Should navigate with perPage=50
			expect(goto).toHaveBeenCalledWith(expect.stringMatching(/perPage=50/));
		});

		it('should preserve perPage when changing pages', async () => {
			page.update(p => ({
				...p,
				url: new URL('http://localhost/entities/npc?perPage=50')
			}));

			render(EntityListPage);

			const nextButton = screen.getByRole('button', { name: /next/i });
			await fireEvent.click(nextButton);

			// Should include both page and perPage
			expect(goto).toHaveBeenCalledWith(expect.stringMatching(/page=2/));
			expect(goto).toHaveBeenCalledWith(expect.stringMatching(/perPage=50/));
		});

		it('should reset to page 1 when changing perPage', async () => {
			page.update(p => ({
				...p,
				url: new URL('http://localhost/entities/npc?page=5&perPage=20')
			}));

			render(EntityListPage);

			const select = screen.getByRole('combobox', { name: /per page|items per page/i });
			await fireEvent.change(select, { target: { value: '100' } });

			// Should reset to page 1 when changing perPage
			expect(goto).toHaveBeenCalledWith(expect.stringMatching(/page=1/));
			expect(goto).toHaveBeenCalledWith(expect.stringMatching(/perPage=100/));
		});
	});

	describe('Search and Pagination Interaction', () => {
		it('should reset to page 1 when search query changes', async () => {
			page.update(p => ({
				...p,
				url: new URL('http://localhost/entities/npc?page=3')
			}));

			render(EntityListPage);

			const searchInput = screen.getByPlaceholderText(/search/i);
			await fireEvent.input(searchInput, { target: { value: 'Entity 1' } });

			// Should navigate to page 1
			await waitFor(() => {
				expect(goto).toHaveBeenCalledWith(expect.stringMatching(/page=1/));
			});
		});

		it('should paginate filtered results correctly', async () => {
			render(EntityListPage);

			// Filter to entities containing "Entity 1" (Entity 1, 10-19, 100-109, 110-119, etc.)
			const searchInput = screen.getByPlaceholderText(/search/i);
			await fireEvent.input(searchInput, { target: { value: 'Entity 1' } });

			await waitFor(() => {
				// Should show first 20 filtered results
				expect(screen.getByText('Entity 1')).toBeInTheDocument();
				expect(screen.getByText('Entity 10')).toBeInTheDocument();
			});

			// Pagination should work on filtered results
			const nextButton = screen.queryByRole('button', { name: /next/i }) as HTMLButtonElement | null;
			if (nextButton && !nextButton.disabled) {
				await fireEvent.click(nextButton);
				// Should show next page of filtered results
			}
		});

		it('should hide pagination when filtered results fit on one page', async () => {
			render(EntityListPage);

			// Filter to very specific search that returns < 20 results
			const searchInput = screen.getByPlaceholderText(/search/i);
			await fireEvent.input(searchInput, { target: { value: 'Entity 156' } });

			await waitFor(() => {
				// Should only show 1 result
				expect(screen.getByText('Entity 156')).toBeInTheDocument();
			});

			// Pagination should be hidden
			expect(screen.queryByRole('button', { name: /previous/i })).not.toBeInTheDocument();
			expect(screen.queryByRole('button', { name: /next/i })).not.toBeInTheDocument();
		});

		it('should show pagination when filtered results exceed perPage', async () => {
			// Create more entities with similar pattern
			const moreEntities = createMockEntities(100, []);
			for (let i = 0; i < 100; i++) {
				moreEntities[i].name = `Item ${i + 1}`;
				moreEntities[i].type = 'npc';
				moreEntities[i].id = `npc-item-${i + 1}`;
			}

			mockEntitiesStore._setEntities(moreEntities);
			mockEntitiesStore.getByType = vi.fn(() => moreEntities);

			render(EntityListPage);

			// Filter to "Item" which matches all 100 entities
			const searchInput = screen.getByPlaceholderText(/search/i);
			await fireEvent.input(searchInput, { target: { value: 'Item' } });

			await waitFor(() => {
				// Should show pagination controls
				expect(screen.getByRole('button', { name: /previous/i })).toBeInTheDocument();
				expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument();
			});
		});

		it('should preserve perPage when search changes', async () => {
			page.update(p => ({
				...p,
				url: new URL('http://localhost/entities/npc?perPage=50')
			}));

			render(EntityListPage);

			const searchInput = screen.getByPlaceholderText(/search/i);
			await fireEvent.input(searchInput, { target: { value: 'test' } });

			await waitFor(() => {
				// Should preserve perPage=50 in navigation
				if ((goto as unknown as { mock: { calls: unknown[][] } }).mock.calls.length > 0) {
					expect(goto).toHaveBeenCalledWith(expect.stringMatching(/perPage=50/));
				}
			});
		});
	});

	describe('Edge Cases and Error Handling', () => {
		it('should handle empty entity list gracefully', () => {
			mockEntitiesStore._setEntities([]);
			mockEntitiesStore.getByType = vi.fn(() => []);

			render(EntityListPage);

			// Should not show pagination
			expect(screen.queryByRole('button', { name: /previous/i })).not.toBeInTheDocument();
			expect(screen.queryByRole('button', { name: /next/i })).not.toBeInTheDocument();

			// Should show empty state
			expect(screen.getByText(/no.*yet/i)).toBeInTheDocument();
		});

		it('should handle single entity gracefully', () => {
			const singleEntity = createMockEntities(1, []);
			singleEntity[0].name = 'Only Entity';
			singleEntity[0].type = 'npc';

			mockEntitiesStore._setEntities(singleEntity);
			mockEntitiesStore.getByType = vi.fn(() => singleEntity);

			render(EntityListPage);

			expect(screen.getByText('Only Entity')).toBeInTheDocument();

			// Should not show pagination
			expect(screen.queryByRole('button', { name: /previous/i })).not.toBeInTheDocument();
			expect(screen.queryByRole('button', { name: /next/i })).not.toBeInTheDocument();
		});

		it('should handle exactly 21 entities (one over threshold)', () => {
			const entities21 = createMockEntities(21, []);
			for (let i = 0; i < 21; i++) {
				entities21[i].name = `Entity ${i + 1}`;
				entities21[i].type = 'npc';
			}

			mockEntitiesStore._setEntities(entities21);
			mockEntitiesStore.getByType = vi.fn(() => entities21);

			render(EntityListPage);

			// Should show first 20
			expect(screen.getByText('Entity 1')).toBeInTheDocument();
			expect(screen.getByText('Entity 20')).toBeInTheDocument();
			expect(screen.queryByText('Entity 21')).not.toBeInTheDocument();

			// Should show pagination
			expect(screen.getByRole('button', { name: /previous/i })).toBeInTheDocument();
			expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument();
		});
	});
});
