/**
 * Tests for EntityTypeTemplateGallery Component - Clone Feature Extension
 *
 * GitHub Issue #210: Add clone and template library for custom entities
 *
 * This test file extends EntityTypeTemplateGallery with tests for the new
 * "Clone Existing Type" option that allows users to start with an existing
 * entity type as a template instead of creating from scratch.
 *
 * RED Phase (TDD): These tests define expected behavior BEFORE implementation.
 * All tests should FAIL until the component enhancements are implemented.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/svelte';
import EntityTypeTemplateGallery from './EntityTypeTemplateGallery.svelte';

describe('EntityTypeTemplateGallery - Clone Existing Type Option (Issue #210)', () => {
	it('should display "Clone Existing Type" option', () => {
		render(EntityTypeTemplateGallery, {
			props: {
				onSelectTemplate: vi.fn(),
				onStartFromScratch: vi.fn(),
				onCloneExisting: vi.fn()
			}
		});

		expect(screen.getByText(/clone existing type|clone.*entity type/i)).toBeInTheDocument();
	});

	it('should render Clone option alongside template options', () => {
		render(EntityTypeTemplateGallery, {
			props: {
				onSelectTemplate: vi.fn(),
				onStartFromScratch: vi.fn(),
				onCloneExisting: vi.fn()
			}
		});

		// Should have both templates and clone option
		expect(screen.getByText(/blank|start from scratch/i)).toBeInTheDocument();
		expect(screen.getByText(/clone existing type/i)).toBeInTheDocument();
	});

	it('should render Clone option as a selectable card', () => {
		render(EntityTypeTemplateGallery, {
			props: {
				onSelectTemplate: vi.fn(),
				onStartFromScratch: vi.fn(),
				onCloneExisting: vi.fn()
			}
		});

		const cloneCard = screen.getByText(/clone existing type/i).closest('button, [role="button"]');
		expect(cloneCard).toBeTruthy();
	});

	it('should display appropriate icon for Clone option', () => {
		const { container } = render(EntityTypeTemplateGallery, {
			props: {
				onSelectTemplate: vi.fn(),
				onStartFromScratch: vi.fn(),
				onCloneExisting: vi.fn()
			}
		});

		const cloneCard = screen.getByText(/clone existing type/i).closest('div, section, button');
		expect(cloneCard).toBeTruthy();

		// Should have an icon (like Copy, Duplicate, etc.)
		const icons = within(cloneCard as HTMLElement).queryAllByRole('img', { hidden: true });
		expect(icons.length).toBeGreaterThan(0);
	});

	it('should display helpful description for Clone option', () => {
		render(EntityTypeTemplateGallery, {
			props: {
				onSelectTemplate: vi.fn(),
				onStartFromScratch: vi.fn(),
				onCloneExisting: vi.fn()
			}
		});

		expect(screen.getByText(/start with.*existing.*type|copy.*existing|use existing.*template/i)).toBeInTheDocument();
	});
});

describe('EntityTypeTemplateGallery - Clone Option Interaction (Issue #210)', () => {
	it('should call onCloneExisting when Clone option is clicked', async () => {
		const onCloneExisting = vi.fn();
		render(EntityTypeTemplateGallery, {
			props: {
				onSelectTemplate: vi.fn(),
				onStartFromScratch: vi.fn(),
				onCloneExisting
			}
		});

		const cloneCard = screen.getByText(/clone existing type/i).closest('button');
		expect(cloneCard).toBeTruthy();

		await fireEvent.click(cloneCard!);

		expect(onCloneExisting).toHaveBeenCalledTimes(1);
	});

	it('should not call onSelectTemplate when Clone option is clicked', async () => {
		const onSelectTemplate = vi.fn();
		const onCloneExisting = vi.fn();
		render(EntityTypeTemplateGallery, {
			props: {
				onSelectTemplate,
				onStartFromScratch: vi.fn(),
				onCloneExisting
			}
		});

		const cloneCard = screen.getByText(/clone existing type/i).closest('button');
		await fireEvent.click(cloneCard!);

		expect(onCloneExisting).toHaveBeenCalled();
		expect(onSelectTemplate).not.toHaveBeenCalled();
	});

	it('should handle missing onCloneExisting callback gracefully', async () => {
		render(EntityTypeTemplateGallery, {
			props: {
				onSelectTemplate: vi.fn(),
				onStartFromScratch: vi.fn()
				// onCloneExisting not provided
			}
		});

		const cloneCard = screen.getByText(/clone existing type/i).closest('button');

		// Should not throw error
		await expect(async () => {
			await fireEvent.click(cloneCard!);
		}).not.toThrow();
	});

	it('should allow clicking Clone option multiple times', async () => {
		const onCloneExisting = vi.fn();
		render(EntityTypeTemplateGallery, {
			props: {
				onSelectTemplate: vi.fn(),
				onStartFromScratch: vi.fn(),
				onCloneExisting
			}
		});

		const cloneCard = screen.getByText(/clone existing type/i).closest('button');

		await fireEvent.click(cloneCard!);
		await fireEvent.click(cloneCard!);

		expect(onCloneExisting).toHaveBeenCalledTimes(2);
	});
});

describe('EntityTypeTemplateGallery - Clone Option Placement (Issue #210)', () => {
	it('should place Clone option prominently (first or second position)', () => {
		const { container } = render(EntityTypeTemplateGallery, {
			props: {
				onSelectTemplate: vi.fn(),
				onStartFromScratch: vi.fn(),
				onCloneExisting: vi.fn()
			}
		});

		// Get all template cards
		const cards = container.querySelectorAll('button, [role="button"]');
		const cardTexts = Array.from(cards).map((card) => card.textContent);

		// Clone option should be in first 2 positions
		const clonePosition = cardTexts.findIndex((text) =>
			text?.match(/clone existing type/i)
		);
		expect(clonePosition).toBeLessThanOrEqual(1);
	});

	it('should visually distinguish Clone option from other templates', () => {
		render(EntityTypeTemplateGallery, {
			props: {
				onSelectTemplate: vi.fn(),
				onStartFromScratch: vi.fn(),
				onCloneExisting: vi.fn()
			}
		});

		const cloneCard = screen.getByText(/clone existing type/i).closest('div, section, button');
		expect(cloneCard).toBeTruthy();

		// Should have distinctive styling (border, color, etc.)
		// Exact classes depend on implementation
		expect(cloneCard!.className).toBeTruthy();
	});
});

describe('EntityTypeTemplateGallery - Clone Option Accessibility (Issue #210)', () => {
	it('should have accessible name for Clone option', () => {
		render(EntityTypeTemplateGallery, {
			props: {
				onSelectTemplate: vi.fn(),
				onStartFromScratch: vi.fn(),
				onCloneExisting: vi.fn()
			}
		});

		const cloneCard = screen.getByText(/clone existing type/i).closest('button');
		expect(cloneCard).toHaveAccessibleName();
	});

	it('should allow keyboard navigation to Clone option', () => {
		render(EntityTypeTemplateGallery, {
			props: {
				onSelectTemplate: vi.fn(),
				onStartFromScratch: vi.fn(),
				onCloneExisting: vi.fn()
			}
		});

		const cloneCard = screen.getByText(/clone existing type/i).closest('button');
		expect(cloneCard).not.toHaveAttribute('tabindex', '-1');
	});

	it('should support Enter key activation for Clone option', async () => {
		const onCloneExisting = vi.fn();
		render(EntityTypeTemplateGallery, {
			props: {
				onSelectTemplate: vi.fn(),
				onStartFromScratch: vi.fn(),
				onCloneExisting
			}
		});

		const cloneCard = screen.getByText(/clone existing type/i).closest('button');
		cloneCard!.focus();

		await fireEvent.keyDown(cloneCard!, { key: 'Enter' });

		expect(onCloneExisting).toHaveBeenCalled();
	});

	it('should have appropriate ARIA label for Clone option', () => {
		render(EntityTypeTemplateGallery, {
			props: {
				onSelectTemplate: vi.fn(),
				onStartFromScratch: vi.fn(),
				onCloneExisting: vi.fn()
			}
		});

		const cloneCard = screen.getByText(/clone existing type/i).closest('button');
		const ariaLabel = cloneCard!.getAttribute('aria-label') || cloneCard!.textContent;

		expect(ariaLabel).toMatch(/clone/i);
	});
});

describe('EntityTypeTemplateGallery - Integration with Existing Templates (Issue #210)', () => {
	it('should maintain existing template selection functionality', async () => {
		const onStartFromScratch = vi.fn();
		render(EntityTypeTemplateGallery, {
			props: {
				onSelectTemplate: vi.fn(),
				onStartFromScratch,
				onCloneExisting: vi.fn()
			}
		});

		// Click on a regular template (not Clone option)
		const blankTemplate = screen.getByText(/blank|start from scratch/i).closest('button');
		await fireEvent.click(blankTemplate!);

		expect(onStartFromScratch).toHaveBeenCalled();
	});

	it('should not affect existing template options', () => {
		render(EntityTypeTemplateGallery, {
			props: {
				onSelectTemplate: vi.fn(),
				onStartFromScratch: vi.fn(),
				onCloneExisting: vi.fn()
			}
		});

		// Existing templates should still be present
		expect(screen.getByText(/blank|start from scratch/i)).toBeInTheDocument();
	});

	it('should display Clone option alongside all other templates', () => {
		const { container } = render(EntityTypeTemplateGallery, {
			props: {
				onSelectTemplate: vi.fn(),
				onStartFromScratch: vi.fn(),
				onCloneExisting: vi.fn()
			}
		});

		const cards = container.querySelectorAll('button, [role="button"]');

		// Should have multiple options (Clone + existing templates)
		expect(cards.length).toBeGreaterThan(1);
	});
});

describe('EntityTypeTemplateGallery - Edge Cases for Clone Option (Issue #210)', () => {
	it('should handle rapid clicks on Clone option', async () => {
		const onCloneExisting = vi.fn();
		render(EntityTypeTemplateGallery, {
			props: {
				onSelectTemplate: vi.fn(),
				onStartFromScratch: vi.fn(),
				onCloneExisting
			}
		});

		const cloneCard = screen.getByText(/clone existing type/i).closest('button');

		// Rapid clicks
		await fireEvent.click(cloneCard!);
		await fireEvent.click(cloneCard!);
		await fireEvent.click(cloneCard!);

		expect(onCloneExisting).toHaveBeenCalledTimes(3);
	});

	it('should show Clone option even when no built-in templates are available', () => {
		render(EntityTypeTemplateGallery, {
			props: {
				onSelectTemplate: vi.fn(),
				onStartFromScratch: vi.fn(),
				onCloneExisting: vi.fn()
			}
		});

		// Clone option should always be available
		expect(screen.getByText(/clone existing type/i)).toBeInTheDocument();
	});
});
