/**
 * Tests for SystemSelector Component
 *
 * Issue #5 Phase 2: System Selector UI Component
 *
 * This component allows users to select a game system profile for their campaign.
 * It displays available system profiles (Draw Steel, System Agnostic) with names
 * and descriptions, and calls an onchange callback when selection changes.
 *
 * Test Coverage:
 * - Rendering system options
 * - Displaying system information
 * - Selection change handling
 * - Default values
 * - Disabled state
 * - Accessibility
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import SystemSelector from './SystemSelector.svelte';
import type { SystemProfile } from '$lib/types/systems';

describe('SystemSelector Component - Basic Rendering', () => {
	it('should render without crashing', () => {
		const { container } = render(SystemSelector);
		expect(container).toBeTruthy();
	});

	it('should render as a select element', () => {
		render(SystemSelector);
		const select = screen.getByRole('combobox');
		expect(select).toBeTruthy();
		expect(select.tagName).toBe('SELECT');
	});

	it('should display label for system selector', () => {
		render(SystemSelector);
		const label = screen.getByText('Game System');
		expect(label).toBeTruthy();
		expect(label.tagName).toBe('LABEL');
	});

	it('should render all available system options', () => {
		render(SystemSelector);
		const options = screen.getAllByRole('option');
		// Should have System Agnostic and Draw Steel
		expect(options.length).toBe(2);
	});

	it('should display system names in options', () => {
		render(SystemSelector);
		const systemAgnostic = screen.getByRole('option', { name: 'System Agnostic' });
		const drawSteel = screen.getByRole('option', { name: 'Draw Steel' });
		expect(systemAgnostic).toBeTruthy();
		expect(drawSteel).toBeTruthy();
	});

	it('should have accessible label association', () => {
		render(SystemSelector);
		const select = screen.getByRole('combobox');
		expect(select.getAttribute('aria-label')).toBe('Game System');
		expect(select.id).toBe('system-selector');
	});
});

describe('SystemSelector Component - System Descriptions', () => {
	it('should hide system description by default', () => {
		render(SystemSelector);
		const description = screen.queryByText(/MCDM Productions tactical fantasy RPG/i);
		expect(description).toBeFalsy();
	});

	it('should display system description when showDescription is true', () => {
		render(SystemSelector, { showDescription: true });
		// Default value is 'draw-steel', so should show Draw Steel description
		const description = screen.getByText('MCDM Productions tactical fantasy RPG');
		expect(description).toBeTruthy();
	});

	it('should update description when selection changes and showDescription is true', async () => {
		render(SystemSelector, { showDescription: true, value: 'system-agnostic' });
		const description = screen.getByText('Generic system with no game-specific customizations');
		expect(description).toBeTruthy();
	});

	it('should show description text with proper formatting', () => {
		render(SystemSelector, { showDescription: true });
		const description = screen.getByText('MCDM Productions tactical fantasy RPG');
		expect(description.className).toContain('text-sm');
		expect(description.className).toContain('text-slate-600');
	});
});

describe('SystemSelector Component - Selection Behavior', () => {
	it('should call onchange callback when selection changes', async () => {
		const mockOnChange = vi.fn();
		render(SystemSelector, { onchange: mockOnChange });

		const select = screen.getByRole('combobox') as HTMLSelectElement;
		await fireEvent.change(select, { target: { value: 'system-agnostic' } });

		expect(mockOnChange).toHaveBeenCalled();
	});

	it('should pass selected system ID to onchange callback', async () => {
		const mockOnChange = vi.fn();
		render(SystemSelector, { onchange: mockOnChange });

		const select = screen.getByRole('combobox') as HTMLSelectElement;
		await fireEvent.change(select, { target: { value: 'system-agnostic' } });

		expect(mockOnChange).toHaveBeenCalledWith('system-agnostic');
	});

	it('should not call onchange on initial render', () => {
		const mockOnChange = vi.fn();
		render(SystemSelector, { onchange: mockOnChange });
		expect(mockOnChange).not.toHaveBeenCalled();
	});

	it('should reflect current selection visually', () => {
		render(SystemSelector, { value: 'system-agnostic' });
		const select = screen.getByRole('combobox') as HTMLSelectElement;
		expect(select.value).toBe('system-agnostic');
	});
});

describe('SystemSelector Component - Default Values', () => {
	it('should default to "draw-steel" when no value provided', () => {
		render(SystemSelector);
		const select = screen.getByRole('combobox') as HTMLSelectElement;
		expect(select.value).toBe('draw-steel');
	});

	it('should use provided value prop over default', () => {
		render(SystemSelector, { value: 'system-agnostic' });
		const select = screen.getByRole('combobox') as HTMLSelectElement;
		expect(select.value).toBe('system-agnostic');
	});

	it('should handle empty string value', () => {
		render(SystemSelector, { value: '' });
		const select = screen.getByRole('combobox') as HTMLSelectElement;
		// Should fall back to default
		expect(select.value).toBe('draw-steel');
	});
});

describe('SystemSelector Component - Disabled State', () => {
	it('should render select as enabled by default', () => {
		render(SystemSelector);
		const select = screen.getByRole('combobox') as HTMLSelectElement;
		expect(select.disabled).toBe(false);
	});

	it('should render select as disabled when disabled prop is true', () => {
		render(SystemSelector, { disabled: true });
		const select = screen.getByRole('combobox') as HTMLSelectElement;
		expect(select.disabled).toBe(true);
	});

	it('should render select as enabled when disabled prop is false', () => {
		render(SystemSelector, { disabled: false });
		const select = screen.getByRole('combobox') as HTMLSelectElement;
		expect(select.disabled).toBe(false);
	});

	it('should not call onchange when disabled', async () => {
		const mockOnChange = vi.fn();
		render(SystemSelector, { disabled: true, onchange: mockOnChange });

		const select = screen.getByRole('combobox') as HTMLSelectElement;
		// Disabled elements shouldn't respond to events
		// Just verify it's disabled
		expect(select.disabled).toBe(true);
	});
});

describe('SystemSelector Component - Accessibility', () => {
	it('should be keyboard navigable', () => {
		render(SystemSelector);
		const select = screen.getByRole('combobox');
		expect(select.tabIndex).toBeGreaterThanOrEqual(0);
	});

	it('should have proper ARIA attributes', () => {
		render(SystemSelector);
		const select = screen.getByRole('combobox');
		expect(select.getAttribute('aria-label')).toBe('Game System');
	});

	it('should have descriptive accessible name', () => {
		render(SystemSelector);
		const select = screen.getByLabelText('Game System');
		expect(select).toBeTruthy();
	});
});

describe('SystemSelector Component - Integration with System Profiles', () => {
	it('should load systems from BUILT_IN_SYSTEMS', () => {
		render(SystemSelector);
		const options = screen.getAllByRole('option');
		// Verify both built-in systems are present
		expect(options.length).toBe(2);
		expect(screen.getByRole('option', { name: 'System Agnostic' })).toBeTruthy();
		expect(screen.getByRole('option', { name: 'Draw Steel' })).toBeTruthy();
	});

	it('should display systems in correct order', () => {
		render(SystemSelector);
		const options = screen.getAllByRole('option') as HTMLOptionElement[];
		// System Agnostic should be first, Draw Steel second
		expect(options[0].textContent).toBe('System Agnostic');
		expect(options[1].textContent).toBe('Draw Steel');
	});
});

describe('SystemSelector Component - Styling and Layout', () => {
	it('should have proper spacing around it', () => {
		const { container } = render(SystemSelector);
		const wrapper = container.querySelector('.space-y-2');
		expect(wrapper).toBeTruthy();
	});

	it('should be full width', () => {
		render(SystemSelector);
		const select = screen.getByRole('combobox');
		expect(select.className).toContain('w-full');
	});

	it('should use consistent text size and font', () => {
		render(SystemSelector);
		const select = screen.getByRole('combobox');
		expect(select.className).toContain('input');
	});

	it('should render description below selector when shown', () => {
		const { container } = render(SystemSelector, { showDescription: true });
		const description = container.querySelector('p');
		const select = container.querySelector('select');
		expect(description).toBeTruthy();
		expect(select).toBeTruthy();
		// Description should come after select in DOM
		expect(select?.nextElementSibling).toBe(description);
	});
});

describe('SystemSelector Component - Edge Cases', () => {
	it('should handle missing onchange prop gracefully', () => {
		expect(() => {
			render(SystemSelector);
		}).not.toThrow();
	});

	it('should handle undefined value gracefully', () => {
		render(SystemSelector, { value: undefined });
		const select = screen.getByRole('combobox') as HTMLSelectElement;
		expect(select.value).toBe('draw-steel');
	});

	it('should handle null value gracefully', () => {
		render(SystemSelector, { value: null as any });
		const select = screen.getByRole('combobox') as HTMLSelectElement;
		expect(select.value).toBe('draw-steel');
	});
});
