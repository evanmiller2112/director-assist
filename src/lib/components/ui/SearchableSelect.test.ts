/**
 * Tests for SearchableSelect Component (TDD RED Phase)
 *
 * GitHub Issue #429: Replace select dropdowns with searchable combo box that supports custom values
 *
 * This component provides a text input styled as a select dropdown with:
 * - Real-time filtering of options as user types
 * - Ability to add custom values not in the predefined list
 * - Keyboard navigation (ArrowDown/ArrowUp, Enter, Escape)
 * - Click-outside to close dropdown
 * - Support for both built-in and user-added custom options
 * - Proper ARIA attributes for accessibility
 *
 * RED Phase (TDD): These tests define expected behavior BEFORE implementation.
 * All tests should FAIL until SearchableSelect component is implemented.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import SearchableSelect from './SearchableSelect.svelte';

describe('SearchableSelect Component - Basic Rendering', () => {
	it('should render without crashing', () => {
		const { container } = render(SearchableSelect, {
			props: {
				value: '',
				options: ['option1', 'option2'],
				onchange: vi.fn()
			}
		});

		expect(container).toBeInTheDocument();
	});

	it('should render an input element with combobox role', () => {
		render(SearchableSelect, {
			props: {
				value: '',
				options: ['option1', 'option2'],
				onchange: vi.fn()
			}
		});

		const input = screen.getByRole('combobox');
		expect(input).toBeInTheDocument();
	});

	it('should display the current value in the input', () => {
		render(SearchableSelect, {
			props: {
				value: 'option1',
				options: ['option1', 'option2'],
				onchange: vi.fn()
			}
		});

		const input = screen.getByRole('combobox') as HTMLInputElement;
		expect(input.value).toBe('option1');
	});

	it('should display placeholder when no value is set', () => {
		render(SearchableSelect, {
			props: {
				value: '',
				options: ['option1', 'option2'],
				placeholder: 'Select an option',
				onchange: vi.fn()
			}
		});

		const input = screen.getByPlaceholderText('Select an option');
		expect(input).toBeInTheDocument();
	});

	it('should use default placeholder when none provided', () => {
		render(SearchableSelect, {
			props: {
				value: '',
				options: ['option1', 'option2'],
				onchange: vi.fn()
			}
		});

		const input = screen.getByRole('combobox') as HTMLInputElement;
		expect(input.placeholder).toBeTruthy();
	});

	it('should render with custom id attribute', () => {
		render(SearchableSelect, {
			props: {
				id: 'test-select',
				value: '',
				options: ['option1'],
				onchange: vi.fn()
			}
		});

		const input = screen.getByRole('combobox');
		expect(input).toHaveAttribute('id', 'test-select');
	});
});

describe('SearchableSelect Component - Dropdown Behavior', () => {
	it('should not show dropdown initially', () => {
		render(SearchableSelect, {
			props: {
				value: '',
				options: ['option1', 'option2'],
				onchange: vi.fn()
			}
		});

		const listbox = screen.queryByRole('listbox');
		expect(listbox).not.toBeInTheDocument();
	});

	it('should show dropdown when input is clicked', async () => {
		render(SearchableSelect, {
			props: {
				value: '',
				options: ['option1', 'option2'],
				onchange: vi.fn()
			}
		});

		const input = screen.getByRole('combobox');
		await fireEvent.click(input);

		const listbox = screen.getByRole('listbox');
		expect(listbox).toBeInTheDocument();
	});

	it('should show dropdown when input receives focus', async () => {
		render(SearchableSelect, {
			props: {
				value: '',
				options: ['option1', 'option2'],
				onchange: vi.fn()
			}
		});

		const input = screen.getByRole('combobox');
		await fireEvent.focus(input);

		const listbox = screen.getByRole('listbox');
		expect(listbox).toBeInTheDocument();
	});

	it('should set aria-expanded to false when dropdown is closed', () => {
		render(SearchableSelect, {
			props: {
				value: '',
				options: ['option1', 'option2'],
				onchange: vi.fn()
			}
		});

		const input = screen.getByRole('combobox');
		expect(input).toHaveAttribute('aria-expanded', 'false');
	});

	it('should set aria-expanded to true when dropdown is open', async () => {
		render(SearchableSelect, {
			props: {
				value: '',
				options: ['option1', 'option2'],
				onchange: vi.fn()
			}
		});

		const input = screen.getByRole('combobox');
		await fireEvent.click(input);

		expect(input).toHaveAttribute('aria-expanded', 'true');
	});
});

describe('SearchableSelect Component - Option Display', () => {
	it('should display all options when dropdown opens', async () => {
		render(SearchableSelect, {
			props: {
				value: '',
				options: ['fighter', 'rogue', 'wizard'],
				onchange: vi.fn()
			}
		});

		const input = screen.getByRole('combobox');
		await fireEvent.click(input);

		expect(screen.getByText('fighter')).toBeInTheDocument();
		expect(screen.getByText('rogue')).toBeInTheDocument();
		expect(screen.getByText('wizard')).toBeInTheDocument();
	});

	it('should format option labels by replacing underscores with spaces', async () => {
		render(SearchableSelect, {
			props: {
				value: '',
				options: ['heavy_armor', 'light_armor'],
				onchange: vi.fn()
			}
		});

		const input = screen.getByRole('combobox');
		await fireEvent.click(input);

		expect(screen.getByText('heavy armor')).toBeInTheDocument();
		expect(screen.getByText('light armor')).toBeInTheDocument();
	});

	it('should display option labels as-is (no automatic capitalization)', async () => {
		render(SearchableSelect, {
			props: {
				value: '',
				options: ['warrior', 'mage'],
				onchange: vi.fn()
			}
		});

		const input = screen.getByRole('combobox');
		await fireEvent.click(input);

		expect(screen.getByText('warrior')).toBeInTheDocument();
		expect(screen.getByText('mage')).toBeInTheDocument();
	});

	it('should display custom options alongside built-in options', async () => {
		render(SearchableSelect, {
			props: {
				value: '',
				options: ['fighter', 'rogue'],
				customOptions: ['artificer', 'blood_hunter'],
				onchange: vi.fn()
			}
		});

		const input = screen.getByRole('combobox');
		await fireEvent.click(input);

		expect(screen.getByText('fighter')).toBeInTheDocument();
		expect(screen.getByText('rogue')).toBeInTheDocument();
		expect(screen.getByText('artificer')).toBeInTheDocument();
		expect(screen.getByText('blood hunter')).toBeInTheDocument();
	});

	it('should handle empty options array', async () => {
		render(SearchableSelect, {
			props: {
				value: '',
				options: [],
				onchange: vi.fn()
			}
		});

		const input = screen.getByRole('combobox');
		await fireEvent.click(input);

		const listbox = screen.getByRole('listbox');
		expect(listbox).toBeInTheDocument();
		// Should show no options or a message
	});

	it('should render each option with role="option"', async () => {
		render(SearchableSelect, {
			props: {
				value: '',
				options: ['option1', 'option2'],
				onchange: vi.fn()
			}
		});

		const input = screen.getByRole('combobox');
		await fireEvent.click(input);

		const options = screen.getAllByRole('option');
		expect(options).toHaveLength(2);
	});
});

describe('SearchableSelect Component - Filtering', () => {
	it('should filter options when user types', async () => {
		render(SearchableSelect, {
			props: {
				value: '',
				options: ['fighter', 'rogue', 'wizard'],
				onchange: vi.fn()
			}
		});

		const input = screen.getByRole('combobox');
		await fireEvent.focus(input);
		await fireEvent.input(input, { target: { value: 'rog' } });

		expect(screen.getByText('rogue')).toBeInTheDocument();
		expect(screen.queryByText('fighter')).not.toBeInTheDocument();
		expect(screen.queryByText('wizard')).not.toBeInTheDocument();
	});

	it('should perform case-insensitive filtering', async () => {
		render(SearchableSelect, {
			props: {
				value: '',
				options: ['Fighter', 'Rogue', 'Wizard'],
				onchange: vi.fn()
			}
		});

		const input = screen.getByRole('combobox');
		await fireEvent.focus(input);
		await fireEvent.input(input, { target: { value: 'FIGHTER' } });

		expect(screen.getByText('Fighter')).toBeInTheDocument();
	});

	it('should filter custom options as well as built-in options', async () => {
		render(SearchableSelect, {
			props: {
				value: '',
				options: ['fighter', 'rogue'],
				customOptions: ['artificer', 'blood_hunter'],
				onchange: vi.fn()
			}
		});

		const input = screen.getByRole('combobox');
		await fireEvent.focus(input);
		await fireEvent.input(input, { target: { value: 'blood' } });

		expect(screen.getByText('blood hunter')).toBeInTheDocument();
		expect(screen.queryByText('fighter')).not.toBeInTheDocument();
	});

	it('should show all options when search text is cleared', async () => {
		render(SearchableSelect, {
			props: {
				value: '',
				options: ['fighter', 'rogue', 'wizard'],
				onchange: vi.fn()
			}
		});

		const input = screen.getByRole('combobox');
		await fireEvent.focus(input);
		await fireEvent.input(input, { target: { value: 'rog' } });
		await fireEvent.input(input, { target: { value: '' } });

		expect(screen.getByText('fighter')).toBeInTheDocument();
		expect(screen.getByText('rogue')).toBeInTheDocument();
		expect(screen.getByText('wizard')).toBeInTheDocument();
	});
});

describe('SearchableSelect Component - Custom Value Addition', () => {
	it('should show "Add" action when typed text does not match any option', async () => {
		render(SearchableSelect, {
			props: {
				value: '',
				options: ['fighter', 'rogue'],
				onchange: vi.fn(),
				onAddCustom: vi.fn()
			}
		});

		const input = screen.getByRole('combobox');
		await fireEvent.focus(input);
		await fireEvent.input(input, { target: { value: 'paladin' } });

		expect(screen.getByText(/Add.*paladin/i)).toBeInTheDocument();
	});

	it('should not show "Add" action when text matches existing option', async () => {
		render(SearchableSelect, {
			props: {
				value: '',
				options: ['fighter', 'rogue'],
				onchange: vi.fn(),
				onAddCustom: vi.fn()
			}
		});

		const input = screen.getByRole('combobox');
		await fireEvent.focus(input);
		await fireEvent.input(input, { target: { value: 'fighter' } });

		expect(screen.queryByText(/Add.*fighter/i)).not.toBeInTheDocument();
	});

	it('should not show "Add" action when onAddCustom callback is not provided', async () => {
		render(SearchableSelect, {
			props: {
				value: '',
				options: ['fighter', 'rogue'],
				onchange: vi.fn()
			}
		});

		const input = screen.getByRole('combobox');
		await fireEvent.focus(input);
		await fireEvent.input(input, { target: { value: 'paladin' } });

		expect(screen.queryByText(/Add/i)).not.toBeInTheDocument();
	});

	it('should call onAddCustom when "Add" action is clicked', async () => {
		const onAddCustom = vi.fn();

		render(SearchableSelect, {
			props: {
				value: '',
				options: ['fighter', 'rogue'],
				onchange: vi.fn(),
				onAddCustom
			}
		});

		const input = screen.getByRole('combobox');
		await fireEvent.focus(input);
		await fireEvent.input(input, { target: { value: 'paladin' } });

		const addOption = screen.getByText(/Add.*paladin/i);
		await fireEvent.click(addOption);

		expect(onAddCustom).toHaveBeenCalledWith('paladin');
	});

	it('should call onchange with new value after adding custom option', async () => {
		const onchange = vi.fn();
		const onAddCustom = vi.fn();

		render(SearchableSelect, {
			props: {
				value: '',
				options: ['fighter', 'rogue'],
				onchange,
				onAddCustom
			}
		});

		const input = screen.getByRole('combobox');
		await fireEvent.focus(input);
		await fireEvent.input(input, { target: { value: 'paladin' } });

		const addOption = screen.getByText(/Add.*paladin/i);
		await fireEvent.click(addOption);

		expect(onchange).toHaveBeenCalledWith('paladin');
	});

	it('should close dropdown after adding custom option', async () => {
		render(SearchableSelect, {
			props: {
				value: '',
				options: ['fighter', 'rogue'],
				onchange: vi.fn(),
				onAddCustom: vi.fn()
			}
		});

		const input = screen.getByRole('combobox');
		await fireEvent.focus(input);
		await fireEvent.input(input, { target: { value: 'paladin' } });

		const addOption = screen.getByText(/Add.*paladin/i);
		await fireEvent.click(addOption);

		await waitFor(() => {
			const listbox = screen.queryByRole('listbox');
			expect(listbox).not.toBeInTheDocument();
		});
	});

	it('should trim whitespace from custom values', async () => {
		const onAddCustom = vi.fn();

		render(SearchableSelect, {
			props: {
				value: '',
				options: ['fighter'],
				onchange: vi.fn(),
				onAddCustom
			}
		});

		const input = screen.getByRole('combobox');
		await fireEvent.focus(input);
		await fireEvent.input(input, { target: { value: '  paladin  ' } });

		const addOption = screen.getByText(/Add.*paladin/i);
		await fireEvent.click(addOption);

		expect(onAddCustom).toHaveBeenCalledWith('paladin');
	});
});

describe('SearchableSelect Component - Selection', () => {
	it('should call onchange when an option is clicked', async () => {
		const onchange = vi.fn();

		render(SearchableSelect, {
			props: {
				value: '',
				options: ['fighter', 'rogue'],
				onchange
			}
		});

		const input = screen.getByRole('combobox');
		await fireEvent.click(input);

		const option = screen.getByText('fighter');
		await fireEvent.click(option);

		expect(onchange).toHaveBeenCalledWith('fighter');
	});

	it('should close dropdown after selecting an option', async () => {
		render(SearchableSelect, {
			props: {
				value: '',
				options: ['fighter', 'rogue'],
				onchange: vi.fn()
			}
		});

		const input = screen.getByRole('combobox');
		await fireEvent.click(input);

		const option = screen.getByText('fighter');
		await fireEvent.click(option);

		await waitFor(() => {
			const listbox = screen.queryByRole('listbox');
			expect(listbox).not.toBeInTheDocument();
		});
	});

	it('should update input value when option is selected', async () => {
		render(SearchableSelect, {
			props: {
				value: '',
				options: ['fighter', 'rogue'],
				onchange: vi.fn()
			}
		});

		const input = screen.getByRole('combobox') as HTMLInputElement;
		await fireEvent.click(input);

		const option = screen.getByText('fighter');
		await fireEvent.click(option);

		await waitFor(() => {
			expect(input.value).toBe('fighter');
		});
	});

	it('should handle selecting custom options', async () => {
		const onchange = vi.fn();

		render(SearchableSelect, {
			props: {
				value: '',
				options: ['fighter'],
				customOptions: ['blood_hunter'],
				onchange
			}
		});

		const input = screen.getByRole('combobox');
		await fireEvent.click(input);

		const option = screen.getByText('blood hunter');
		await fireEvent.click(option);

		expect(onchange).toHaveBeenCalledWith('blood_hunter');
	});
});

describe('SearchableSelect Component - Keyboard Navigation', () => {
	it('should open dropdown on ArrowDown key', async () => {
		render(SearchableSelect, {
			props: {
				value: '',
				options: ['fighter', 'rogue'],
				onchange: vi.fn()
			}
		});

		const input = screen.getByRole('combobox');
		await fireEvent.keyDown(input, { key: 'ArrowDown' });

		const listbox = screen.getByRole('listbox');
		expect(listbox).toBeInTheDocument();
	});

	it('should navigate to next option with ArrowDown', async () => {
		render(SearchableSelect, {
			props: {
				value: '',
				options: ['fighter', 'rogue', 'wizard'],
				onchange: vi.fn()
			}
		});

		const input = screen.getByRole('combobox');
		await fireEvent.click(input);
		await fireEvent.keyDown(input, { key: 'ArrowDown' });

		// First option should be highlighted
		const firstOption = screen.getByText('fighter');
		expect(firstOption.parentElement).toHaveAttribute('aria-selected', 'true');
	});

	it('should navigate to previous option with ArrowUp', async () => {
		render(SearchableSelect, {
			props: {
				value: '',
				options: ['fighter', 'rogue', 'wizard'],
				onchange: vi.fn()
			}
		});

		const input = screen.getByRole('combobox');
		await fireEvent.click(input);
		await fireEvent.keyDown(input, { key: 'ArrowDown' });
		await fireEvent.keyDown(input, { key: 'ArrowDown' });
		await fireEvent.keyDown(input, { key: 'ArrowUp' });

		// Should go back to first option
		const firstOption = screen.getByText('fighter');
		expect(firstOption.parentElement).toHaveAttribute('aria-selected', 'true');
	});

	it('should select highlighted option with Enter key', async () => {
		const onchange = vi.fn();

		render(SearchableSelect, {
			props: {
				value: '',
				options: ['fighter', 'rogue'],
				onchange
			}
		});

		const input = screen.getByRole('combobox');
		await fireEvent.click(input);
		await fireEvent.keyDown(input, { key: 'ArrowDown' });
		await fireEvent.keyDown(input, { key: 'Enter' });

		expect(onchange).toHaveBeenCalledWith('fighter');
	});

	it('should close dropdown with Escape key', async () => {
		render(SearchableSelect, {
			props: {
				value: '',
				options: ['fighter', 'rogue'],
				onchange: vi.fn()
			}
		});

		const input = screen.getByRole('combobox');
		await fireEvent.click(input);
		await fireEvent.keyDown(input, { key: 'Escape' });

		await waitFor(() => {
			const listbox = screen.queryByRole('listbox');
			expect(listbox).not.toBeInTheDocument();
		});
	});

	it('should not close dropdown when navigating with arrows', async () => {
		render(SearchableSelect, {
			props: {
				value: '',
				options: ['fighter', 'rogue', 'wizard'],
				onchange: vi.fn()
			}
		});

		const input = screen.getByRole('combobox');
		await fireEvent.click(input);
		await fireEvent.keyDown(input, { key: 'ArrowDown' });
		await fireEvent.keyDown(input, { key: 'ArrowDown' });

		const listbox = screen.getByRole('listbox');
		expect(listbox).toBeInTheDocument();
	});

	it('should wrap to last option when pressing ArrowUp on first option', async () => {
		render(SearchableSelect, {
			props: {
				value: '',
				options: ['fighter', 'rogue', 'wizard'],
				onchange: vi.fn()
			}
		});

		const input = screen.getByRole('combobox');
		await fireEvent.click(input);
		await fireEvent.keyDown(input, { key: 'ArrowUp' });

		const lastOption = screen.getByText('wizard');
		expect(lastOption.parentElement).toHaveAttribute('aria-selected', 'true');
	});

	it('should wrap to first option when pressing ArrowDown on last option', async () => {
		render(SearchableSelect, {
			props: {
				value: '',
				options: ['fighter', 'rogue', 'wizard'],
				onchange: vi.fn()
			}
		});

		const input = screen.getByRole('combobox');
		await fireEvent.click(input);
		await fireEvent.keyDown(input, { key: 'ArrowUp' }); // Go to last
		await fireEvent.keyDown(input, { key: 'ArrowDown' }); // Wrap to first

		const firstOption = screen.getByText('fighter');
		expect(firstOption.parentElement).toHaveAttribute('aria-selected', 'true');
	});
});

describe('SearchableSelect Component - Click Outside', () => {
	it('should close dropdown when clicking outside', async () => {
		const { container } = render(SearchableSelect, {
			props: {
				value: '',
				options: ['fighter', 'rogue'],
				onchange: vi.fn()
			}
		});

		const input = screen.getByRole('combobox');
		await fireEvent.click(input);

		// Click outside the component
		await fireEvent.mouseDown(document.body);

		await waitFor(() => {
			const listbox = screen.queryByRole('listbox');
			expect(listbox).not.toBeInTheDocument();
		});
	});

	it('should not close dropdown when clicking inside dropdown', async () => {
		render(SearchableSelect, {
			props: {
				value: '',
				options: ['fighter', 'rogue'],
				onchange: vi.fn()
			}
		});

		const input = screen.getByRole('combobox');
		await fireEvent.click(input);

		const listbox = screen.getByRole('listbox');
		await fireEvent.mouseDown(listbox);

		expect(listbox).toBeInTheDocument();
	});
});

describe('SearchableSelect Component - Disabled State', () => {
	it('should render as disabled when disabled prop is true', () => {
		render(SearchableSelect, {
			props: {
				value: '',
				options: ['fighter', 'rogue'],
				disabled: true,
				onchange: vi.fn()
			}
		});

		const input = screen.getByRole('combobox');
		expect(input).toBeDisabled();
	});

	it('should not open dropdown when disabled and clicked', async () => {
		render(SearchableSelect, {
			props: {
				value: '',
				options: ['fighter', 'rogue'],
				disabled: true,
				onchange: vi.fn()
			}
		});

		const input = screen.getByRole('combobox');
		await fireEvent.click(input);

		const listbox = screen.queryByRole('listbox');
		expect(listbox).not.toBeInTheDocument();
	});

	it('should have reduced opacity when disabled', () => {
		const { container } = render(SearchableSelect, {
			props: {
				value: '',
				options: ['fighter', 'rogue'],
				disabled: true,
				onchange: vi.fn()
			}
		});

		const input = screen.getByRole('combobox');
		expect(input).toHaveClass(/opacity/);
	});
});

describe('SearchableSelect Component - Error State', () => {
	it('should render without error styling by default', () => {
		const { container } = render(SearchableSelect, {
			props: {
				value: '',
				options: ['fighter', 'rogue'],
				onchange: vi.fn()
			}
		});

		const input = screen.getByRole('combobox');
		expect(input).not.toHaveClass(/border-red/);
	});

	it('should render with error styling when error prop is provided', () => {
		render(SearchableSelect, {
			props: {
				value: '',
				options: ['fighter', 'rogue'],
				error: 'This field is required',
				onchange: vi.fn()
			}
		});

		const input = screen.getByRole('combobox');
		expect(input).toHaveClass(/border-red/);
	});

	it('should display error message when error prop is provided', () => {
		render(SearchableSelect, {
			props: {
				value: '',
				options: ['fighter', 'rogue'],
				error: 'This field is required',
				onchange: vi.fn()
			}
		});

		expect(screen.getByText('This field is required')).toBeInTheDocument();
	});

	it('should not display error message when error prop is empty', () => {
		render(SearchableSelect, {
			props: {
				value: '',
				options: ['fighter', 'rogue'],
				error: '',
				onchange: vi.fn()
			}
		});

		const input = screen.getByRole('combobox');
		expect(input).not.toHaveClass(/border-red/);
	});
});

describe('SearchableSelect Component - Accessibility', () => {
	it('should have proper ARIA combobox attributes', () => {
		render(SearchableSelect, {
			props: {
				value: '',
				options: ['fighter', 'rogue'],
				onchange: vi.fn()
			}
		});

		const input = screen.getByRole('combobox');
		expect(input).toHaveAttribute('aria-autocomplete', 'list');
		expect(input).toHaveAttribute('aria-expanded');
	});

	it('should have aria-controls pointing to listbox', async () => {
		render(SearchableSelect, {
			props: {
				value: '',
				options: ['fighter', 'rogue'],
				onchange: vi.fn()
			}
		});

		const input = screen.getByRole('combobox');
		await fireEvent.click(input);

		const listbox = screen.getByRole('listbox');
		const listboxId = listbox.getAttribute('id');

		expect(input).toHaveAttribute('aria-controls', listboxId);
	});

	it('should have aria-activedescendant when option is highlighted', async () => {
		render(SearchableSelect, {
			props: {
				value: '',
				options: ['fighter', 'rogue'],
				onchange: vi.fn()
			}
		});

		const input = screen.getByRole('combobox');
		await fireEvent.click(input);
		await fireEvent.keyDown(input, { key: 'ArrowDown' });

		expect(input).toHaveAttribute('aria-activedescendant');
	});

	it('should announce current value to screen readers', () => {
		render(SearchableSelect, {
			props: {
				value: 'fighter',
				options: ['fighter', 'rogue'],
				onchange: vi.fn()
			}
		});

		const input = screen.getByRole('combobox') as HTMLInputElement;
		expect(input.value).toBe('fighter');
	});

	it('should be keyboard navigable', async () => {
		render(SearchableSelect, {
			props: {
				value: '',
				options: ['fighter', 'rogue'],
				onchange: vi.fn()
			}
		});

		const input = screen.getByRole('combobox');
		input.focus();

		expect(document.activeElement).toBe(input);
	});
});

describe('SearchableSelect Component - Edge Cases', () => {
	it('should handle very long option labels gracefully', async () => {
		const longOption = 'A'.repeat(100);

		render(SearchableSelect, {
			props: {
				value: '',
				options: [longOption, 'rogue'],
				onchange: vi.fn()
			}
		});

		const input = screen.getByRole('combobox');
		await fireEvent.click(input);

		expect(screen.getByText(new RegExp(longOption.substring(0, 50)))).toBeInTheDocument();
	});

	it('should handle special characters in options', async () => {
		render(SearchableSelect, {
			props: {
				value: '',
				options: ["O'Brien", 'Smith & Jones'],
				onchange: vi.fn()
			}
		});

		const input = screen.getByRole('combobox');
		await fireEvent.click(input);

		expect(screen.getByText("O'Brien")).toBeInTheDocument();
		expect(screen.getByText('Smith & Jones')).toBeInTheDocument();
	});

	it('should handle unicode characters in options', async () => {
		render(SearchableSelect, {
			props: {
				value: '',
				options: ['Måns', '雪'],
				onchange: vi.fn()
			}
		});

		const input = screen.getByRole('combobox');
		await fireEvent.click(input);

		expect(screen.getByText('Måns')).toBeInTheDocument();
		expect(screen.getByText('雪')).toBeInTheDocument();
	});

	it('should handle rapid open/close cycles', async () => {
		render(SearchableSelect, {
			props: {
				value: '',
				options: ['fighter', 'rogue'],
				onchange: vi.fn()
			}
		});

		const input = screen.getByRole('combobox');

		for (let i = 0; i < 5; i++) {
			await fireEvent.click(input);
			await fireEvent.keyDown(input, { key: 'Escape' });
		}

		// Should not crash
		expect(input).toBeInTheDocument();
	});

	it('should handle duplicate option values gracefully', async () => {
		render(SearchableSelect, {
			props: {
				value: '',
				options: ['fighter', 'fighter', 'rogue'],
				onchange: vi.fn()
			}
		});

		const input = screen.getByRole('combobox');
		await fireEvent.click(input);

		// Should render all options even if duplicates
		const options = screen.getAllByRole('option');
		expect(options.length).toBeGreaterThan(0);
	});

	it('should handle empty string as value', () => {
		render(SearchableSelect, {
			props: {
				value: '',
				options: ['fighter', 'rogue'],
				onchange: vi.fn()
			}
		});

		const input = screen.getByRole('combobox') as HTMLInputElement;
		expect(input.value).toBe('');
	});

	it('should handle value not in options list', () => {
		render(SearchableSelect, {
			props: {
				value: 'paladin',
				options: ['fighter', 'rogue'],
				onchange: vi.fn()
			}
		});

		const input = screen.getByRole('combobox') as HTMLInputElement;
		expect(input.value).toBe('paladin');
	});
});

describe('SearchableSelect Component - Visual Styling', () => {
	it('should have dropdown chevron icon', () => {
		const { container } = render(SearchableSelect, {
			props: {
				value: '',
				options: ['fighter', 'rogue'],
				onchange: vi.fn()
			}
		});

		const icon = container.querySelector('svg');
		expect(icon).toBeInTheDocument();
	});

	it('should style input like a select dropdown', () => {
		render(SearchableSelect, {
			props: {
				value: '',
				options: ['fighter', 'rogue'],
				onchange: vi.fn()
			}
		});

		const input = screen.getByRole('combobox');
		expect(input).toHaveClass(/border/);
		expect(input).toHaveClass(/rounded/);
	});

	it('should style dropdown with proper positioning', async () => {
		render(SearchableSelect, {
			props: {
				value: '',
				options: ['fighter', 'rogue'],
				onchange: vi.fn()
			}
		});

		const input = screen.getByRole('combobox');
		await fireEvent.click(input);

		const listbox = screen.getByRole('listbox');
		expect(listbox).toHaveClass(/absolute/);
	});

	it('should highlight selected option with background', async () => {
		render(SearchableSelect, {
			props: {
				value: '',
				options: ['fighter', 'rogue'],
				onchange: vi.fn()
			}
		});

		const input = screen.getByRole('combobox');
		await fireEvent.click(input);
		await fireEvent.keyDown(input, { key: 'ArrowDown' });

		const highlightedOption = screen.getByText('fighter');
		expect(highlightedOption.parentElement).toHaveClass(/bg-/);
	});
});
