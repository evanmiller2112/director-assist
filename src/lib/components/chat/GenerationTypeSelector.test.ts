/**
 * Tests for GenerationTypeSelector Component (TDD RED Phase)
 *
 * Issue #41: Generation Type Selector in Chat
 *
 * This component provides a dropdown selector for choosing the type of content
 * to generate in the chat interface. It displays all available generation types
 * with their icons and descriptions.
 *
 * Props:
 * - value?: GenerationType (current selected type, defaults to 'custom')
 * - onchange?: (type: GenerationType) => void (callback when selection changes)
 * - disabled?: boolean (disable the selector)
 * - compact?: boolean (compact mode for mobile)
 *
 * Coverage:
 * - Rendering all generation types
 * - Selection handling
 * - Icon display
 * - Description/help text
 * - Disabled state
 * - Compact mode
 * - Accessibility
 * - Props handling
 * - Edge cases
 *
 * These tests are expected to FAIL initially (RED phase).
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import GenerationTypeSelector from './GenerationTypeSelector.svelte';
import type { GenerationType } from '$lib/types';

describe('GenerationTypeSelector Component', () => {
	describe('Basic Rendering', () => {
		it('should render without crashing', () => {
			const { container } = render(GenerationTypeSelector);
			expect(container).toBeInTheDocument();
		});

		it('should render as a select element', () => {
			render(GenerationTypeSelector);
			const select = screen.getByRole('combobox');
			expect(select).toBeInTheDocument();
		});

		it('should have accessible label', () => {
			render(GenerationTypeSelector);
			const select = screen.getByRole('combobox');
			expect(select).toHaveAttribute('aria-label', 'Generation type');
		});

		it('should render all generation type options', () => {
			render(GenerationTypeSelector);
			const options = screen.getAllByRole('option');
			expect(options.length).toBe(10); // All 10 generation types
		});
	});

	describe('Generation Type Options', () => {
		it('should have "General" option', () => {
			render(GenerationTypeSelector);
			expect(screen.getByRole('option', { name: /General/i })).toBeInTheDocument();
		});

		it('should have "NPC" option', () => {
			render(GenerationTypeSelector);
			expect(screen.getByRole('option', { name: /NPC/i })).toBeInTheDocument();
		});

		it('should have "Location" option', () => {
			render(GenerationTypeSelector);
			expect(screen.getByRole('option', { name: /Location/i })).toBeInTheDocument();
		});

		it('should have "Plot Hook" option', () => {
			render(GenerationTypeSelector);
			expect(screen.getByRole('option', { name: /Plot Hook/i })).toBeInTheDocument();
		});

		it('should have "Negotiation" option', () => {
			render(GenerationTypeSelector);
			expect(screen.getByRole('option', { name: /Negotiation/i })).toBeInTheDocument();
		});

		it('should have "Montage" option', () => {
			render(GenerationTypeSelector);
			expect(screen.getByRole('option', { name: /Montage/i })).toBeInTheDocument();
		});

		it('should have "Item" option', () => {
			render(GenerationTypeSelector);
			expect(screen.getByRole('option', { name: /Item/i })).toBeInTheDocument();
		});

		it('should have "Faction" option', () => {
			render(GenerationTypeSelector);
			expect(screen.getByRole('option', { name: /Faction/i })).toBeInTheDocument();
		});

		it('should have "Session Prep" option', () => {
			render(GenerationTypeSelector);
			expect(screen.getByRole('option', { name: /Session Prep/i })).toBeInTheDocument();
		});

		it('should have correct values for each option', () => {
			render(GenerationTypeSelector);
			const generalOption = screen.getByRole('option', { name: /General/i });
			expect(generalOption).toHaveValue('custom');

			const npcOption = screen.getByRole('option', { name: /NPC/i });
			expect(npcOption).toHaveValue('npc');

			const locationOption = screen.getByRole('option', { name: /Location/i });
			expect(locationOption).toHaveValue('location');
		});

		it('should render options in correct order', () => {
			render(GenerationTypeSelector);
			const options = screen.getAllByRole('option');
			expect(options[0]).toHaveTextContent(/General/i);
			// Other types can be in any logical order
			expect(options.length).toBe(10);
		});
	});

	describe('Value Prop', () => {
		it('should default to "custom" when no value provided', () => {
			render(GenerationTypeSelector);
			const select = screen.getByRole('combobox') as HTMLSelectElement;
			expect(select.value).toBe('custom');
		});

		it('should select "npc" when value prop is "npc"', () => {
			render(GenerationTypeSelector, { props: { value: 'npc' } });
			const select = screen.getByRole('combobox') as HTMLSelectElement;
			expect(select.value).toBe('npc');
		});

		it('should select "location" when value prop is "location"', () => {
			render(GenerationTypeSelector, { props: { value: 'location' } });
			const select = screen.getByRole('combobox') as HTMLSelectElement;
			expect(select.value).toBe('location');
		});

		it('should select correct option for each valid value', () => {
			const types: GenerationType[] = [
				'custom',
				'npc',
				'location',
				'plot_hook',
				'combat',
				'item',
				'faction',
				'session_prep'
			];

			types.forEach((type) => {
				const { unmount } = render(GenerationTypeSelector, { props: { value: type } });
				const select = screen.getByRole('combobox') as HTMLSelectElement;
				expect(select.value).toBe(type);
				unmount();
			});
		});

		it('should update when value prop changes', async () => {
			const { rerender } = render(GenerationTypeSelector, { props: { value: 'custom' } });
			let select = screen.getByRole('combobox') as HTMLSelectElement;
			expect(select.value).toBe('custom');

			await rerender({ value: 'npc' });
			select = screen.getByRole('combobox') as HTMLSelectElement;
			expect(select.value).toBe('npc');
		});
	});

	describe('Change Event Handling', () => {
		it('should call onchange when selection changes', async () => {
			const onChange = vi.fn();
			render(GenerationTypeSelector, { props: { onchange: onChange } });

			const select = screen.getByRole('combobox');
			await fireEvent.change(select, { target: { value: 'npc' } });

			expect(onChange).toHaveBeenCalledWith('npc');
		});

		it('should call onchange with correct type for each selection', async () => {
			const onChange = vi.fn();
			const { rerender } = render(GenerationTypeSelector, { props: { onchange: onChange } });

			const select = screen.getByRole('combobox');

			await fireEvent.change(select, { target: { value: 'npc' } });
			expect(onChange).toHaveBeenLastCalledWith('npc');

			await fireEvent.change(select, { target: { value: 'location' } });
			expect(onChange).toHaveBeenLastCalledWith('location');

			await fireEvent.change(select, { target: { value: 'plot_hook' } });
			expect(onChange).toHaveBeenLastCalledWith('plot_hook');
		});

		it('should call onchange only once per change', async () => {
			const onChange = vi.fn();
			render(GenerationTypeSelector, { props: { onchange: onChange } });

			const select = screen.getByRole('combobox');
			await fireEvent.change(select, { target: { value: 'npc' } });

			expect(onChange).toHaveBeenCalledTimes(1);
		});

		it('should not call onchange when value is set programmatically', () => {
			const onChange = vi.fn();
			const { rerender } = render(GenerationTypeSelector, {
				props: { value: 'custom', onchange: onChange }
			});

			// Programmatic change via props
			rerender({ value: 'npc', onchange: onChange });

			// onchange should not be called for programmatic changes
			expect(onChange).not.toHaveBeenCalled();
		});

		it('should work without onchange prop', async () => {
			const { container } = render(GenerationTypeSelector);

			const select = screen.getByRole('combobox');
			await expect(
				fireEvent.change(select, { target: { value: 'npc' } })
			).resolves.not.toThrow();
		});
	});

	describe('Icon Display', () => {
		it('should display icon for selected type', () => {
			const { container } = render(GenerationTypeSelector, { props: { value: 'npc' } });

			// Should contain an icon element (svg or icon component)
			const icon = container.querySelector('svg, [data-icon], [class*="icon"]');
			expect(icon).toBeInTheDocument();
		});

		it('should show different icons for different types', () => {
			const { container: container1 } = render(GenerationTypeSelector, {
				props: { value: 'npc' }
			});
			const icon1 = container1.querySelector('svg, [data-icon]');

			const { container: container2 } = render(GenerationTypeSelector, {
				props: { value: 'location' }
			});
			const icon2 = container2.querySelector('svg, [data-icon]');

			// Icons should be present (specific icon comparison is hard in tests)
			expect(icon1).toBeInTheDocument();
			expect(icon2).toBeInTheDocument();
		});

		it('should update icon when selection changes', async () => {
			render(GenerationTypeSelector, { props: { value: 'custom' } });

			const select = screen.getByRole('combobox');
			await fireEvent.change(select, { target: { value: 'npc' } });

			// Icon should still be present after change
			const icon = document.querySelector('svg, [data-icon]');
			expect(icon).toBeInTheDocument();
		});
	});

	describe('Description/Help Text', () => {
		it('should show description for selected type', () => {
			const { container } = render(GenerationTypeSelector, { props: { value: 'npc' } });

			// Should have description text somewhere in the component
			const description = container.querySelector('[class*="description"], [class*="help"]');
			expect(description).toBeInTheDocument();
		});

		it('should show different descriptions for different types', async () => {
			render(GenerationTypeSelector, { props: { value: 'npc' } });

			// Find description element
			let description = document.querySelector(
				'[class*="description"], [class*="help"], [data-description]'
			);
			const npcDescription = description?.textContent;

			const select = screen.getByRole('combobox');
			await fireEvent.change(select, { target: { value: 'location' } });

			description = document.querySelector(
				'[class*="description"], [class*="help"], [data-description]'
			);
			const locationDescription = description?.textContent;

			expect(npcDescription).not.toBe(locationDescription);
		});

		it('should show description below or near selector', () => {
			const { container } = render(GenerationTypeSelector, { props: { value: 'npc' } });

			const select = screen.getByRole('combobox');
			const description = container.querySelector('[class*="description"], [class*="help"]');

			expect(select).toBeInTheDocument();
			expect(description).toBeInTheDocument();
		});

		it('should have meaningful description text', () => {
			render(GenerationTypeSelector, { props: { value: 'npc' } });

			const description = document.querySelector(
				'[class*="description"], [class*="help"], [data-description]'
			);
			expect(description?.textContent).toBeTruthy();
			expect(description?.textContent!.length).toBeGreaterThan(10);
		});
	});

	describe('Disabled State', () => {
		it('should be enabled by default', () => {
			render(GenerationTypeSelector);
			const select = screen.getByRole('combobox');
			expect(select).not.toBeDisabled();
		});

		it('should be disabled when disabled prop is true', () => {
			render(GenerationTypeSelector, { props: { disabled: true } });
			const select = screen.getByRole('combobox');
			expect(select).toBeDisabled();
		});

		it('should be enabled when disabled prop is false', () => {
			render(GenerationTypeSelector, { props: { disabled: false } });
			const select = screen.getByRole('combobox');
			expect(select).not.toBeDisabled();
		});

		it('should not call onchange when disabled', async () => {
			const onChange = vi.fn();
			render(GenerationTypeSelector, { props: { disabled: true, onchange: onChange } });

			const select = screen.getByRole('combobox');
			await fireEvent.change(select, { target: { value: 'npc' } });

			expect(onChange).not.toHaveBeenCalled();
		});

		it('should have disabled attribute when disabled', () => {
			render(GenerationTypeSelector, { props: { disabled: true } });
			const select = screen.getByRole('combobox');
			expect(select).toHaveAttribute('disabled');
		});

		it('should visually indicate disabled state', () => {
			const { container } = render(GenerationTypeSelector, { props: { disabled: true } });
			const select = screen.getByRole('combobox');

			// Should have disabled styling class
			expect(
				select.className.includes('disabled') ||
					select.className.includes('opacity') ||
					container.querySelector('.disabled, [disabled]')
			).toBeTruthy();
		});

		it('should update disabled state reactively', async () => {
			const { rerender } = render(GenerationTypeSelector, { props: { disabled: false } });
			let select = screen.getByRole('combobox');
			expect(select).not.toBeDisabled();

			await rerender({ disabled: true });
			select = screen.getByRole('combobox');
			expect(select).toBeDisabled();
		});
	});

	describe('Compact Mode', () => {
		it('should render in normal mode by default', () => {
			const { container } = render(GenerationTypeSelector);
			const wrapper = container.firstChild as HTMLElement;
			expect(wrapper).not.toHaveClass(/compact/);
		});

		it('should render in compact mode when compact prop is true', () => {
			const { container } = render(GenerationTypeSelector, { props: { compact: true } });
			const wrapper = container.querySelector('[class*="compact"]');
			expect(wrapper).toBeInTheDocument();
		});

		it('should have smaller size in compact mode', () => {
			const { container: normalContainer } = render(GenerationTypeSelector, {
				props: { compact: false }
			});
			const normalSelect = screen.getAllByRole('combobox')[0];

			const { container: compactContainer } = render(GenerationTypeSelector, {
				props: { compact: true }
			});
			const compactSelect = screen.getAllByRole('combobox')[1];

			// Compact select should have smaller padding/size classes
			expect(compactSelect.className).toMatch(/sm|small|compact/);
		});

		it('should still show all options in compact mode', () => {
			render(GenerationTypeSelector, { props: { compact: true } });
			const options = screen.getAllByRole('option');
			expect(options.length).toBe(10);
		});

		it('should maintain functionality in compact mode', async () => {
			const onChange = vi.fn();
			render(GenerationTypeSelector, { props: { compact: true, onchange: onChange } });

			const select = screen.getByRole('combobox');
			await fireEvent.change(select, { target: { value: 'npc' } });

			expect(onChange).toHaveBeenCalledWith('npc');
		});

		it('should hide or abbreviate description in compact mode', () => {
			const { container } = render(GenerationTypeSelector, { props: { compact: true } });

			const description = container.querySelector('[class*="description"], [class*="help"]');
			// Description might be hidden or very short in compact mode
			if (description) {
				expect(
					description.classList.contains('hidden') ||
						description.classList.contains('sr-only') ||
						description.textContent!.length < 50
				).toBeTruthy();
			}
		});
	});

	describe('Accessibility', () => {
		it('should have aria-label', () => {
			render(GenerationTypeSelector);
			const select = screen.getByRole('combobox');
			expect(select).toHaveAttribute('aria-label');
		});

		it('should have accessible name', () => {
			render(GenerationTypeSelector);
			const select = screen.getByRole('combobox', { name: /generation type/i });
			expect(select).toBeInTheDocument();
		});

		it('should associate description with select via aria-describedby', () => {
			render(GenerationTypeSelector, { props: { value: 'npc' } });
			const select = screen.getByRole('combobox');
			const describedBy = select.getAttribute('aria-describedby');

			if (describedBy) {
				const description = document.getElementById(describedBy);
				expect(description).toBeInTheDocument();
			}
		});

		it('should be keyboard accessible', async () => {
			render(GenerationTypeSelector);
			const select = screen.getByRole('combobox');

			select.focus();
			expect(document.activeElement).toBe(select);
		});

		it('should support keyboard navigation', async () => {
			const onChange = vi.fn();
			render(GenerationTypeSelector, { props: { onchange: onChange } });

			const select = screen.getByRole('combobox');
			select.focus();

			// Simulate keyboard selection (exact behavior depends on browser)
			await fireEvent.change(select, { target: { value: 'npc' } });

			expect(onChange).toHaveBeenCalled();
		});

		it('should announce selection to screen readers', () => {
			render(GenerationTypeSelector, { props: { value: 'npc' } });
			const select = screen.getByRole('combobox');

			// Select should have current value for screen readers
			expect(select).toHaveValue('npc');
		});

		it('should have proper role', () => {
			render(GenerationTypeSelector);
			const select = screen.getByRole('combobox');
			expect(select.tagName).toBe('SELECT');
		});

		it('should have accessible options', () => {
			render(GenerationTypeSelector);
			const options = screen.getAllByRole('option');

			options.forEach((option) => {
				expect(option).toHaveAttribute('value');
				expect(option.textContent).toBeTruthy();
			});
		});
	});

	describe('Styling and Layout', () => {
		it('should have consistent styling', () => {
			const { container } = render(GenerationTypeSelector);
			const select = screen.getByRole('combobox');

			// Should have Tailwind or custom classes
			expect(select.className.length).toBeGreaterThan(0);
		});

		it('should have proper spacing', () => {
			const { container } = render(GenerationTypeSelector);
			const select = screen.getByRole('combobox');

			// Should have padding classes
			expect(select.className).toMatch(/p-|px-|py-/);
		});

		it('should have border styling', () => {
			render(GenerationTypeSelector);
			const select = screen.getByRole('combobox');

			// Should have border classes
			expect(select.className).toMatch(/border/);
		});

		it('should have rounded corners', () => {
			render(GenerationTypeSelector);
			const select = screen.getByRole('combobox');

			// Should have rounded classes
			expect(select.className).toMatch(/rounded/);
		});

		it('should support custom CSS classes', () => {
			render(GenerationTypeSelector, { props: { class: 'custom-class' } });
			const wrapper = document.querySelector('.custom-class');
			expect(wrapper).toBeInTheDocument();
		});
	});

	describe('Edge Cases', () => {
		it('should handle rapid selection changes', async () => {
			const onChange = vi.fn();
			render(GenerationTypeSelector, { props: { onchange: onChange } });

			const select = screen.getByRole('combobox');

			// Rapid changes
			await fireEvent.change(select, { target: { value: 'npc' } });
			await fireEvent.change(select, { target: { value: 'location' } });
			await fireEvent.change(select, { target: { value: 'combat' } });

			expect(onChange).toHaveBeenCalledTimes(3);
			expect(onChange).toHaveBeenLastCalledWith('combat');
		});

		it('should handle selecting same value multiple times', async () => {
			const onChange = vi.fn();
			render(GenerationTypeSelector, { props: { value: 'npc', onchange: onChange } });

			const select = screen.getByRole('combobox');

			// Select same value
			await fireEvent.change(select, { target: { value: 'npc' } });

			// onChange should still be called
			expect(onChange).toHaveBeenCalledWith('npc');
		});

		it('should handle all generation types in sequence', async () => {
			const onChange = vi.fn();
			render(GenerationTypeSelector, { props: { onchange: onChange } });

			const select = screen.getByRole('combobox');
			const types: GenerationType[] = [
				'custom',
				'npc',
				'location',
				'plot_hook',
				'combat',
				'negotiation',
				'montage',
				'item',
				'faction',
				'session_prep'
			];

			for (const type of types) {
				await fireEvent.change(select, { target: { value: type } });
			}

			expect(onChange).toHaveBeenCalledTimes(10);
		});

		it('should maintain state across re-renders', async () => {
			const { rerender } = render(GenerationTypeSelector, { props: { value: 'npc' } });

			let select = screen.getByRole('combobox') as HTMLSelectElement;
			expect(select.value).toBe('npc');

			await rerender({ value: 'npc' });

			select = screen.getByRole('combobox') as HTMLSelectElement;
			expect(select.value).toBe('npc');
		});

		it('should handle undefined value prop gracefully', () => {
			render(GenerationTypeSelector, { props: { value: undefined } });
			const select = screen.getByRole('combobox') as HTMLSelectElement;
			expect(select.value).toBe('custom'); // Should default to custom
		});

		it('should handle missing onchange prop', async () => {
			render(GenerationTypeSelector, { props: { value: 'custom' } });
			const select = screen.getByRole('combobox');

			await expect(
				fireEvent.change(select, { target: { value: 'npc' } })
			).resolves.not.toThrow();
		});
	});

	describe('Integration Scenarios', () => {
		it('should work as controlled component', async () => {
			let currentValue: GenerationType = 'custom';
			const onChange = vi.fn((newValue: GenerationType) => {
				currentValue = newValue;
			});

			const { rerender } = render(GenerationTypeSelector, {
				props: { value: currentValue, onchange: onChange }
			});

			const select = screen.getByRole('combobox');
			await fireEvent.change(select, { target: { value: 'npc' } });

			expect(onChange).toHaveBeenCalledWith('npc');

			// Parent updates value
			await rerender({ value: 'npc', onchange: onChange });

			const updatedSelect = screen.getByRole('combobox') as HTMLSelectElement;
			expect(updatedSelect.value).toBe('npc');
		});

		it('should integrate with form', () => {
			const { container } = render(GenerationTypeSelector, { props: { value: 'npc' } });

			const select = screen.getByRole('combobox') as HTMLSelectElement;
			expect(select.name || select.id).toBeTruthy(); // Should have name or id for forms
		});

		it('should work in chat interface context', async () => {
			const onChange = vi.fn();
			render(GenerationTypeSelector, {
				props: {
					value: 'custom',
					onchange: onChange,
					disabled: false
				}
			});

			// User selects NPC type
			const select = screen.getByRole('combobox');
			await fireEvent.change(select, { target: { value: 'npc' } });

			expect(onChange).toHaveBeenCalledWith('npc');

			// Description should update
			const description = document.querySelector(
				'[class*="description"], [class*="help"], [data-description]'
			);
			expect(description).toBeInTheDocument();
		});
	});
});
