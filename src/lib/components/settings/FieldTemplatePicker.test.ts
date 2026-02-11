/**
 * Tests for FieldTemplatePicker Component
 *
 * GitHub Issue #210: Add clone and template library for custom entities
 *
 * This component displays a modal that allows users to select a field template
 * to apply to their entity type. It shows available templates with preview
 * information and allows expanding to see field details.
 *
 * RED Phase (TDD): These tests define expected behavior BEFORE implementation.
 * All tests should FAIL until the component is implemented.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, within, waitFor } from '@testing-library/svelte';
import FieldTemplatePicker from './FieldTemplatePicker.svelte';
import type { FieldTemplate } from '$lib/types';

// Mock the campaign store
vi.mock('$lib/stores/campaign.svelte', () => ({
	campaignStore: {
		fieldTemplates: [
			{
				id: 'template-1',
				name: 'Combat Stats',
				description: 'Standard combat statistics for characters and NPCs',
				category: 'draw-steel',
				fieldDefinitions: [
					{ key: 'hit_points', label: 'Hit Points', type: 'number', required: true, order: 0 },
					{ key: 'armor_class', label: 'Armor Class', type: 'number', required: true, order: 1 },
					{ key: 'initiative', label: 'Initiative', type: 'number', required: false, order: 2 }
				],
				createdAt: new Date('2024-01-01'),
				updatedAt: new Date('2024-01-15')
			},
			{
				id: 'template-2',
				name: 'Social Attributes',
				description: 'Social interaction and reputation fields',
				category: 'user',
				fieldDefinitions: [
					{ key: 'reputation', label: 'Reputation', type: 'text', required: false, order: 0 },
					{ key: 'faction_standing', label: 'Faction Standing', type: 'select', required: false, order: 1, options: ['Allied', 'Neutral', 'Hostile'] }
				],
				createdAt: new Date('2024-02-01'),
				updatedAt: new Date('2024-02-01')
			},
			{
				id: 'template-3',
				name: 'Location Details',
				description: 'Geographic and environmental details',
				category: 'user',
				fieldDefinitions: [
					{ key: 'climate', label: 'Climate', type: 'text', required: false, order: 0 },
					{ key: 'population', label: 'Population', type: 'number', required: false, order: 1 },
					{ key: 'government', label: 'Government', type: 'text', required: false, order: 2 },
					{ key: 'economy', label: 'Economy', type: 'textarea', required: false, order: 3 }
				],
				createdAt: new Date('2024-03-01'),
				updatedAt: new Date('2024-03-01')
			}
		]
	}
}));

describe('FieldTemplatePicker - Basic Rendering (Issue #210)', () => {
	it('should render without crashing', () => {
		const { container } = render(FieldTemplatePicker, {
			props: {
				open: false,
				onselect: vi.fn(),
				oncancel: vi.fn()
			}
		});
		expect(container).toBeInTheDocument();
	});

	it('should not be visible when open is false', () => {
		render(FieldTemplatePicker, {
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
		render(FieldTemplatePicker, {
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
		render(FieldTemplatePicker, {
			props: {
				open: true,
				onselect: vi.fn(),
				oncancel: vi.fn()
			}
		});

		expect(screen.getByText(/select.*field template|choose.*template/i)).toBeInTheDocument();
	});

	it('should have dialog role for accessibility', () => {
		render(FieldTemplatePicker, {
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

describe('FieldTemplatePicker - Template Display (Issue #210)', () => {
	it('should display all available field templates', () => {
		render(FieldTemplatePicker, {
			props: {
				open: true,
				onselect: vi.fn(),
				oncancel: vi.fn()
			}
		});

		expect(screen.getByText('Combat Stats')).toBeInTheDocument();
		expect(screen.getByText('Social Attributes')).toBeInTheDocument();
		expect(screen.getByText('Location Details')).toBeInTheDocument();
	});

	it('should display template descriptions', () => {
		render(FieldTemplatePicker, {
			props: {
				open: true,
				onselect: vi.fn(),
				oncancel: vi.fn()
			}
		});

		expect(screen.getByText(/Standard combat statistics/)).toBeInTheDocument();
		expect(screen.getByText(/Social interaction and reputation/)).toBeInTheDocument();
	});

	it('should display field count for each template', () => {
		render(FieldTemplatePicker, {
			props: {
				open: true,
				onselect: vi.fn(),
				oncancel: vi.fn()
			}
		});

		// Combat Stats has 3 fields
		expect(screen.getByText(/3.*fields?/i)).toBeInTheDocument();
		// Social Attributes has 2 fields
		expect(screen.getByText(/2.*fields?/i)).toBeInTheDocument();
		// Location Details has 4 fields
		expect(screen.getByText(/4.*fields?/i)).toBeInTheDocument();
	});

	it('should display template categories', () => {
		render(FieldTemplatePicker, {
			props: {
				open: true,
				onselect: vi.fn(),
				oncancel: vi.fn()
			}
		});

		// Should show categories (Draw Steel, User, etc.)
		expect(screen.getByText(/draw steel/i)).toBeInTheDocument();
		// There are multiple "User" labels, so use getAllByText
		const userLabels = screen.getAllByText(/user/i);
		expect(userLabels.length).toBeGreaterThan(0);
	});

	it('should render each template as a selectable card', () => {
		render(FieldTemplatePicker, {
			props: {
				open: true,
				onselect: vi.fn(),
				oncancel: vi.fn()
			}
		});

		const combatCard = screen.getByText('Combat Stats').closest('button, [role="button"]');
		expect(combatCard).toBeTruthy();

		const socialCard = screen.getByText('Social Attributes').closest('button, [role="button"]');
		expect(socialCard).toBeTruthy();
	});
});

describe('FieldTemplatePicker - Empty State (Issue #210)', () => {
	it('should show empty state when no templates exist', () => {
		vi.doMock('$lib/stores/campaign.svelte', () => ({
			campaignStore: {
				fieldTemplates: []
			}
		}));

		render(FieldTemplatePicker, {
			props: {
				open: true,
				onselect: vi.fn(),
				oncancel: vi.fn()
			}
		});

		expect(screen.getByText(/no.*field templates|no templates available/i)).toBeInTheDocument();
	});

	it('should show helpful message in empty state', () => {
		vi.doMock('$lib/stores/campaign.svelte', () => ({
			campaignStore: {
				fieldTemplates: []
			}
		}));

		render(FieldTemplatePicker, {
			props: {
				open: true,
				onselect: vi.fn(),
				oncancel: vi.fn()
			}
		});

		expect(screen.getByText(/create.*template|get started/i)).toBeInTheDocument();
	});
});

describe('FieldTemplatePicker - Field Preview (Issue #210)', () => {
	it('should allow expanding template to preview fields', async () => {
		render(FieldTemplatePicker, {
			props: {
				open: true,
				onselect: vi.fn(),
				oncancel: vi.fn()
			}
		});

		// Find expand button for Combat Stats template
		const combatCard = screen.getByText('Combat Stats').closest('div, section');
		expect(combatCard).toBeTruthy();

		const expandButton = within(combatCard as HTMLElement).getByRole('button', { name: /expand|show.*fields|preview/i });
		await fireEvent.click(expandButton);

		// Should show field names
		expect(screen.getByText('Hit Points')).toBeInTheDocument();
		expect(screen.getByText('Armor Class')).toBeInTheDocument();
		expect(screen.getByText('Initiative')).toBeInTheDocument();
	});

	it('should show field types in preview', async () => {
		render(FieldTemplatePicker, {
			props: {
				open: true,
				onselect: vi.fn(),
				oncancel: vi.fn()
			}
		});

		const combatCard = screen.getByText('Combat Stats').closest('div, section');
		const expandButton = within(combatCard as HTMLElement).getByRole('button', { name: /expand|show.*fields|preview/i });
		await fireEvent.click(expandButton);

		// Should show field types
		expect(screen.getAllByText(/number|text|select/i).length).toBeGreaterThan(0);
	});

	it('should allow collapsing expanded preview', async () => {
		render(FieldTemplatePicker, {
			props: {
				open: true,
				onselect: vi.fn(),
				oncancel: vi.fn()
			}
		});

		const combatCard = screen.getByText('Combat Stats').closest('div, section');
		const expandButton = within(combatCard as HTMLElement).getByRole('button', { name: /expand|show.*fields|preview/i });

		// Expand
		await fireEvent.click(expandButton);
		expect(screen.getByText('Hit Points')).toBeInTheDocument();

		// Collapse
		await fireEvent.click(expandButton);
		expect(screen.queryByText('Initiative')).not.toBeInTheDocument();
	});

	it('should show required indicator for required fields', async () => {
		render(FieldTemplatePicker, {
			props: {
				open: true,
				onselect: vi.fn(),
				oncancel: vi.fn()
			}
		});

		const combatCard = screen.getByText('Combat Stats').closest('div, section');
		const expandButton = within(combatCard as HTMLElement).getByRole('button', { name: /expand|show.*fields|preview/i });
		await fireEvent.click(expandButton);

		// Hit Points and Armor Class are required
		const requiredIndicators = screen.getAllByText(/required|\*/);
		expect(requiredIndicators.length).toBeGreaterThanOrEqual(2);
	});
});

describe('FieldTemplatePicker - Template Selection (Issue #210)', () => {
	it('should call onselect when template is selected', async () => {
		const onselect = vi.fn();
		render(FieldTemplatePicker, {
			props: {
				open: true,
				onselect,
				oncancel: vi.fn()
			}
		});

		const combatCard = screen.getByText('Combat Stats').closest('button');
		await fireEvent.click(combatCard!);

		expect(onselect).toHaveBeenCalledTimes(1);

		const selectedTemplate: FieldTemplate = onselect.mock.calls[0][0];
		expect(selectedTemplate.name).toBe('Combat Stats');
		expect(selectedTemplate.fieldDefinitions).toHaveLength(3);
	});

	it('should pass complete template data to onselect', async () => {
		const onselect = vi.fn();
		render(FieldTemplatePicker, {
			props: {
				open: true,
				onselect,
				oncancel: vi.fn()
			}
		});

		const socialCard = screen.getByText('Social Attributes').closest('button');
		await fireEvent.click(socialCard!);

		const selectedTemplate: FieldTemplate = onselect.mock.calls[0][0];
		expect(selectedTemplate.id).toBe('template-2');
		expect(selectedTemplate.name).toBe('Social Attributes');
		expect(selectedTemplate.category).toBe('user');
		expect(selectedTemplate.fieldDefinitions).toHaveLength(2);
	});

	it('should allow selecting different templates', async () => {
		const onselect = vi.fn();
		render(FieldTemplatePicker, {
			props: {
				open: true,
				onselect,
				oncancel: vi.fn()
			}
		});

		const combatCard = screen.getByText('Combat Stats').closest('button');
		await fireEvent.click(combatCard!);

		expect(onselect).toHaveBeenCalledWith(
			expect.objectContaining({ name: 'Combat Stats' })
		);

		onselect.mockClear();

		const locationCard = screen.getByText('Location Details').closest('button');
		await fireEvent.click(locationCard!);

		expect(onselect).toHaveBeenCalledWith(
			expect.objectContaining({ name: 'Location Details' })
		);
	});
});

describe('FieldTemplatePicker - Cancel Action (Issue #210)', () => {
	it('should have Cancel button', () => {
		render(FieldTemplatePicker, {
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
		render(FieldTemplatePicker, {
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
		render(FieldTemplatePicker, {
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
		render(FieldTemplatePicker, {
			props: {
				open: true,
				onselect,
				oncancel
			}
		});

		const cancelButton = screen.getByRole('button', { name: /cancel/i });
		await fireEvent.click(cancelButton);

		expect(onselect).not.toHaveBeenCalled();
	});
});

describe('FieldTemplatePicker - Search/Filter (Issue #210)', () => {
	it('should have search input field', () => {
		render(FieldTemplatePicker, {
			props: {
				open: true,
				onselect: vi.fn(),
				oncancel: vi.fn()
			}
		});

		const searchInput = screen.getByRole('textbox');
		expect(searchInput).toBeInTheDocument();
	});

	it('should filter templates by name', async () => {
		render(FieldTemplatePicker, {
			props: {
				open: true,
				onselect: vi.fn(),
				oncancel: vi.fn()
			}
		});

		const searchInput = screen.getByRole('textbox');
		await fireEvent.input(searchInput, { target: { value: 'combat' } });

		expect(screen.getByText('Combat Stats')).toBeInTheDocument();
		expect(screen.queryByText('Social Attributes')).not.toBeInTheDocument();
		expect(screen.queryByText('Location Details')).not.toBeInTheDocument();
	});

	it('should filter templates by description', async () => {
		render(FieldTemplatePicker, {
			props: {
				open: true,
				onselect: vi.fn(),
				oncancel: vi.fn()
			}
		});

		const searchInput = screen.getByRole('textbox');
		await fireEvent.input(searchInput, { target: { value: 'social' } });

		expect(screen.getByText('Social Attributes')).toBeInTheDocument();
		expect(screen.queryByText('Combat Stats')).not.toBeInTheDocument();
	});

	it('should perform case-insensitive search', async () => {
		render(FieldTemplatePicker, {
			props: {
				open: true,
				onselect: vi.fn(),
				oncancel: vi.fn()
			}
		});

		const searchInput = screen.getByRole('textbox');
		await fireEvent.input(searchInput, { target: { value: 'LOCATION' } });

		expect(screen.getByText('Location Details')).toBeInTheDocument();
	});

	it('should show no results message when search has no matches', async () => {
		render(FieldTemplatePicker, {
			props: {
				open: true,
				onselect: vi.fn(),
				oncancel: vi.fn()
			}
		});

		const searchInput = screen.getByRole('textbox');
		await fireEvent.input(searchInput, { target: { value: 'nonexistent' } });

		expect(screen.getByText(/no.*templates.*found|no matches/i)).toBeInTheDocument();
	});

	it('should restore all templates when search is cleared', async () => {
		render(FieldTemplatePicker, {
			props: {
				open: true,
				onselect: vi.fn(),
				oncancel: vi.fn()
			}
		});

		const searchInput = screen.getByRole('textbox');

		await fireEvent.input(searchInput, { target: { value: 'combat' } });
		expect(screen.queryByText('Social Attributes')).not.toBeInTheDocument();

		await fireEvent.input(searchInput, { target: { value: '' } });
		expect(screen.getByText('Combat Stats')).toBeInTheDocument();
		expect(screen.getByText('Social Attributes')).toBeInTheDocument();
		expect(screen.getByText('Location Details')).toBeInTheDocument();
	});
});

describe('FieldTemplatePicker - Accessibility (Issue #210)', () => {
	it('should have aria-modal attribute', () => {
		render(FieldTemplatePicker, {
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
		render(FieldTemplatePicker, {
			props: {
				open: true,
				onselect: vi.fn(),
				oncancel: vi.fn()
			}
		});

		const dialog = screen.getByRole('dialog');
		const title = screen.getByText(/select.*field template/i);

		const titleId = title.getAttribute('id');
		expect(titleId).toBeTruthy();
		expect(dialog).toHaveAttribute('aria-labelledby', titleId);
	});

	it('should focus search input when opened', async () => {
		render(FieldTemplatePicker, {
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
		render(FieldTemplatePicker, {
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

	it('should have accessible names for template cards', () => {
		render(FieldTemplatePicker, {
			props: {
				open: true,
				onselect: vi.fn(),
				oncancel: vi.fn()
			}
		});

		const combatCard = screen.getByText('Combat Stats').closest('button');
		expect(combatCard).toHaveAccessibleName();
	});
});

describe('FieldTemplatePicker - Edge Cases (Issue #210)', () => {
	it('should handle template with no fields', () => {
		vi.doMock('$lib/stores/campaign.svelte', () => ({
			campaignStore: {
				fieldTemplates: [
					{
						id: 'empty-template',
						name: 'Empty Template',
						description: 'No fields yet',
						category: 'user',
						fieldDefinitions: [],
						createdAt: new Date(),
						updatedAt: new Date()
					}
				]
			}
		}));

		render(FieldTemplatePicker, {
			props: {
				open: true,
				onselect: vi.fn(),
				oncancel: vi.fn()
			}
		});

		expect(screen.getByText(/0.*fields?/i)).toBeInTheDocument();
	});

	it('should handle template with very long name', () => {
		const longName = 'A'.repeat(100);
		vi.doMock('$lib/stores/campaign.svelte', () => ({
			campaignStore: {
				fieldTemplates: [
					{
						id: 'long-name',
						name: longName,
						description: 'Test',
						category: 'user',
						fieldDefinitions: [],
						createdAt: new Date(),
						updatedAt: new Date()
					}
				]
			}
		}));

		render(FieldTemplatePicker, {
			props: {
				open: true,
				onselect: vi.fn(),
				oncancel: vi.fn()
			}
		});

		expect(screen.getByText(longName)).toBeInTheDocument();
	});

	it('should clear expanded state when modal is closed and reopened', async () => {
		const { rerender } = render(FieldTemplatePicker, {
			props: {
				open: true,
				onselect: vi.fn(),
				oncancel: vi.fn()
			}
		});

		// Expand a template
		const combatCard = screen.getByText('Combat Stats').closest('div, section');
		const expandButton = within(combatCard as HTMLElement).getByRole('button', { name: /expand|show.*fields|preview/i });
		await fireEvent.click(expandButton);
		expect(screen.getByText('Hit Points')).toBeInTheDocument();

		// Close modal
		rerender({ open: false, onselect: vi.fn(), oncancel: vi.fn() });

		// Reopen modal
		rerender({ open: true, onselect: vi.fn(), oncancel: vi.fn() });

		// Expanded state should be reset
		expect(screen.queryByText('Initiative')).not.toBeInTheDocument();
	});
});
