/**
 * Tests for FormActionBar Component
 *
 * Issue #44: Sticky/Floating Action Buttons for Entity Forms
 *
 * This component provides a sticky action bar at the bottom of entity forms.
 * It's used to keep form action buttons (Save, Cancel, etc.) visible and
 * accessible while scrolling through long forms.
 *
 * Note: Tests for children/slot rendering are not included because Svelte 5's
 * Snippet API is not properly supported by @testing-library/svelte when passing
 * children as props. The slot functionality works correctly in actual usage.
 */

import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/svelte';
import FormActionBar from './FormActionBar.svelte';

describe('FormActionBar Component - Basic Rendering (Issue #44)', () => {
	it('should render without crashing', () => {
		const { container } = render(FormActionBar);
		expect(container).toBeInTheDocument();
	});

	it('should render as a div element', () => {
		const { container } = render(FormActionBar);
		const actionBar = container.querySelector('div');
		expect(actionBar).toBeInTheDocument();
	});
});

describe('FormActionBar Component - Sticky Positioning (Issue #44)', () => {
	it('should have sticky positioning class', () => {
		const { container } = render(FormActionBar);
		const actionBar = container.firstChild as HTMLElement;

		expect(actionBar).toHaveClass('sticky');
	});

	it('should have bottom-0 positioning class', () => {
		const { container } = render(FormActionBar);
		const actionBar = container.firstChild as HTMLElement;

		expect(actionBar).toHaveClass('bottom-0');
	});

	it('should have both sticky and bottom-0 classes together', () => {
		const { container } = render(FormActionBar);
		const actionBar = container.firstChild as HTMLElement;

		expect(actionBar.className).toMatch(/sticky/);
		expect(actionBar.className).toMatch(/bottom-0/);
	});
});

describe('FormActionBar Component - Background Styling (Issue #44)', () => {
	it('should have white background class', () => {
		const { container } = render(FormActionBar);
		const actionBar = container.firstChild as HTMLElement;

		expect(actionBar).toHaveClass('bg-white');
	});

	it('should have dark mode background class', () => {
		const { container } = render(FormActionBar);
		const actionBar = container.firstChild as HTMLElement;

		expect(actionBar.className).toMatch(/dark:bg-slate-900/);
	});

	it('should have both light and dark background classes', () => {
		const { container } = render(FormActionBar);
		const actionBar = container.firstChild as HTMLElement;

		const classes = actionBar.className;
		expect(classes).toMatch(/bg-white/);
		expect(classes).toMatch(/dark:bg-slate-900/);
	});
});

describe('FormActionBar Component - Border Styling (Issue #44)', () => {
	it('should have top border class', () => {
		const { container } = render(FormActionBar);
		const actionBar = container.firstChild as HTMLElement;

		expect(actionBar).toHaveClass('border-t');
	});

	it('should have light mode border color class', () => {
		const { container } = render(FormActionBar);
		const actionBar = container.firstChild as HTMLElement;

		expect(actionBar).toHaveClass('border-slate-200');
	});

	it('should have dark mode border color class', () => {
		const { container } = render(FormActionBar);
		const actionBar = container.firstChild as HTMLElement;

		expect(actionBar.className).toMatch(/dark:border-slate-700/);
	});
});

describe('FormActionBar Component - Shadow Styling (Issue #44)', () => {
	it('should have upward shadow class', () => {
		const { container } = render(FormActionBar);
		const actionBar = container.firstChild as HTMLElement;

		// Check for the specific shadow that casts upward
		expect(actionBar.className).toMatch(/shadow/);
	});

	it('should have shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] for upward shadow', () => {
		const { container } = render(FormActionBar);
		const actionBar = container.firstChild as HTMLElement;

		// This specific shadow creates the upward effect
		expect(actionBar.className).toContain('shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]');
	});
});

describe('FormActionBar Component - Z-Index (Issue #44)', () => {
	it('should have z-10 class for proper layering', () => {
		const { container } = render(FormActionBar);
		const actionBar = container.firstChild as HTMLElement;

		expect(actionBar).toHaveClass('z-10');
	});

	it('should maintain z-10 even with custom classes', () => {
		const { container } = render(FormActionBar, {
			props: {
				class: 'custom-class'
			}
		});
		const actionBar = container.firstChild as HTMLElement;

		expect(actionBar).toHaveClass('z-10');
	});
});

describe('FormActionBar Component - Custom Classes (Issue #44)', () => {
	it('should accept additional classes via class prop', () => {
		const { container } = render(FormActionBar, {
			props: {
				class: 'my-custom-class'
			}
		});
		const actionBar = container.firstChild as HTMLElement;

		expect(actionBar).toHaveClass('my-custom-class');
	});

	it('should merge custom classes with default classes', () => {
		const { container } = render(FormActionBar, {
			props: {
				class: 'extra-padding'
			}
		});
		const actionBar = container.firstChild as HTMLElement;

		// Should have custom class
		expect(actionBar).toHaveClass('extra-padding');

		// Should still have default sticky class
		expect(actionBar).toHaveClass('sticky');
	});

	it('should handle multiple custom classes', () => {
		const { container } = render(FormActionBar, {
			props: {
				class: 'custom-one custom-two custom-three'
			}
		});
		const actionBar = container.firstChild as HTMLElement;

		expect(actionBar).toHaveClass('custom-one');
		expect(actionBar).toHaveClass('custom-two');
		expect(actionBar).toHaveClass('custom-three');
	});

	it('should work without class prop (optional)', () => {
		const { container } = render(FormActionBar);
		const actionBar = container.firstChild as HTMLElement;

		// Should still have all required default classes
		expect(actionBar).toHaveClass('sticky');
		expect(actionBar).toHaveClass('bottom-0');
		expect(actionBar).toHaveClass('bg-white');
	});
});

describe('FormActionBar Component - Complete Class Set (Issue #44)', () => {
	it('should have all required positioning classes', () => {
		const { container } = render(FormActionBar);
		const actionBar = container.firstChild as HTMLElement;
		const classes = actionBar.className;

		expect(classes).toMatch(/sticky/);
		expect(classes).toMatch(/bottom-0/);
		expect(classes).toMatch(/z-10/);
	});

	it('should have all required background classes', () => {
		const { container } = render(FormActionBar);
		const actionBar = container.firstChild as HTMLElement;
		const classes = actionBar.className;

		expect(classes).toMatch(/bg-white/);
		expect(classes).toMatch(/dark:bg-slate-900/);
	});

	it('should have all required border classes', () => {
		const { container } = render(FormActionBar);
		const actionBar = container.firstChild as HTMLElement;
		const classes = actionBar.className;

		expect(classes).toMatch(/border-t/);
		expect(classes).toMatch(/border-slate-200/);
		expect(classes).toMatch(/dark:border-slate-700/);
	});

	it('should have all required classes in a single component', () => {
		const { container } = render(FormActionBar);
		const actionBar = container.firstChild as HTMLElement;
		const classes = actionBar.className;

		// All required classes should be present
		expect(classes).toMatch(/sticky/);
		expect(classes).toMatch(/bottom-0/);
		expect(classes).toMatch(/bg-white/);
		expect(classes).toMatch(/dark:bg-slate-900/);
		expect(classes).toMatch(/border-t/);
		expect(classes).toMatch(/border-slate-200/);
		expect(classes).toMatch(/dark:border-slate-700/);
		expect(classes).toContain('shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]');
		expect(classes).toMatch(/z-10/);
	});
});

describe('FormActionBar Component - Layout (Issue #44)', () => {
	it('should have flex layout for button arrangement', () => {
		const { container } = render(FormActionBar);
		const actionBar = container.firstChild as HTMLElement;

		// Common layout pattern for action bars
		expect(actionBar.className).toMatch(/flex|grid/);
	});

	it('should have padding for button spacing', () => {
		const { container } = render(FormActionBar);
		const actionBar = container.firstChild as HTMLElement;

		// Should have padding classes
		expect(actionBar.className).toMatch(/p-\d+|px-\d+|py-\d+/);
	});

	it('should have gap for multiple children', () => {
		const { container } = render(FormActionBar);
		const actionBar = container.firstChild as HTMLElement;

		// Should have gap or space between buttons
		expect(actionBar.className).toMatch(/gap-\d+|space-x-\d+/);
	});
});

describe('FormActionBar Component - Visual Consistency (Issue #44)', () => {
	it('should match BulkActionsBar styling patterns', () => {
		const { container } = render(FormActionBar);
		const actionBar = container.firstChild as HTMLElement;
		const classes = actionBar.className;

		// Should use similar styling to BulkActionsBar
		expect(classes).toMatch(/sticky/);
		expect(classes).toMatch(/bottom-0/);
		expect(classes).toMatch(/bg-white/);
		expect(classes).toMatch(/dark:bg-slate/);
		expect(classes).toMatch(/border-t/);
	});

	it('should have consistent dark mode theming', () => {
		const { container } = render(FormActionBar);
		const actionBar = container.firstChild as HTMLElement;
		const classes = actionBar.className;

		// Dark mode classes should be consistent with app theme
		expect(classes).toMatch(/dark:bg-slate-900/);
		expect(classes).toMatch(/dark:border-slate-700/);
	});

	it('should have proper shadow for elevation', () => {
		const { container } = render(FormActionBar);
		const actionBar = container.firstChild as HTMLElement;

		// Shadow creates visual separation from content
		expect(actionBar.className).toMatch(/shadow/);
	});
});
