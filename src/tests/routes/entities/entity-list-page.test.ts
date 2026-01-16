import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/svelte';
import EntityListPage from '../../../routes/entities/[type]/+page.svelte';
import { createMockEntity, createMockEntities } from '../../utils/testUtils';
import { createMockEntitiesStore, createMockCampaignStore } from '../../mocks/stores';
import { setPageParams } from '../../mocks/$app/stores';
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

			const entityCards = screen.getAllByRole('link');
			expect(entityCards.length).toBeGreaterThan(0);

			// Each entity card should have a Link button somewhere in its hierarchy
			entityCards.forEach(card => {
				const linkButton = within(card).queryByRole('button', { name: /link/i });
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

			const entityCards = screen.getAllByRole('link');
			const firstCard = entityCards[0];
			const linkButton = within(firstCard).getByRole('button', { name: /link/i });

			// Button should be within the card's DOM tree
			expect(firstCard.contains(linkButton)).toBe(true);
		});

		it('should apply group hover pattern to parent card', () => {
			render(EntityListPage);

			const entityCards = screen.getAllByRole('link');
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
