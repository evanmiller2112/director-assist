import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import LoadingSpinner from './LoadingSpinner.svelte';

/**
 * Tests for LoadingSpinner Component
 *
 * Issue #12: Add Loading States & Async Operation Feedback
 *
 * This component provides a reusable loading spinner for indicating async operations.
 * It should be used across the application for entity CRUD, campaign loading, and settings operations.
 *
 * These tests are written in the RED phase of TDD - they will FAIL until the
 * component is implemented.
 */

describe('LoadingSpinner Component - Basic Rendering (Issue #12)', () => {
	it('should render without crashing', () => {
		const { container } = render(LoadingSpinner);
		expect(container).toBeInTheDocument();
	});

	it('should display a loading spinner element', () => {
		const { container } = render(LoadingSpinner);

		// Should have a spinner element (could be SVG, div with animation, etc.)
		const spinner = container.querySelector('[class*="spin"], [class*="load"], svg, [role="status"]');
		expect(spinner).toBeInTheDocument();
	});

	it('should have appropriate ARIA attributes for accessibility', () => {
		const { container } = render(LoadingSpinner);

		// Should have role="status" for screen readers
		const spinner = container.querySelector('[role="status"]');
		expect(spinner).toBeInTheDocument();
	});

	it('should have sr-only text for screen readers', () => {
		render(LoadingSpinner);

		// Should have screen reader text indicating loading state
		expect(screen.getByText(/loading/i)).toBeInTheDocument();
	});
});

describe('LoadingSpinner Component - Size Variants', () => {
	it('should render small size variant', () => {
		const { container } = render(LoadingSpinner, {
			props: { size: 'sm' }
		});

		const spinner = container.querySelector('[class*="spin"], [class*="load"], svg');
		expect(spinner).toBeInTheDocument();
		// Small size should have appropriate class
		expect(spinner).toHaveClass(/sm|small/);
	});

	it('should render medium size variant as default', () => {
		const { container } = render(LoadingSpinner);

		const spinner = container.querySelector('[class*="spin"], [class*="load"], svg');
		expect(spinner).toBeInTheDocument();
		// Default should be medium
		expect(spinner).toHaveClass(/md|medium/);
	});

	it('should render large size variant', () => {
		const { container } = render(LoadingSpinner, {
			props: { size: 'lg' }
		});

		const spinner = container.querySelector('[class*="spin"], [class*="load"], svg');
		expect(spinner).toBeInTheDocument();
		expect(spinner).toHaveClass(/lg|large/);
	});

	it('should accept custom size in pixels', () => {
		const { container } = render(LoadingSpinner, {
			props: { size: 32 }
		});

		const spinner = container.querySelector('[class*="spin"], [class*="load"], svg');
		expect(spinner).toBeInTheDocument();
	});
});

describe('LoadingSpinner Component - Color Customization', () => {
	it('should render with default color', () => {
		const { container } = render(LoadingSpinner);

		const spinner = container.querySelector('[class*="spin"], [class*="load"], svg');
		expect(spinner).toBeInTheDocument();
	});

	it('should render with primary color variant', () => {
		const { container } = render(LoadingSpinner, {
			props: { color: 'primary' }
		});

		const spinner = container.querySelector('[class*="spin"], [class*="load"], svg');
		expect(spinner).toHaveClass(/primary/);
	});

	it('should render with white color variant for dark backgrounds', () => {
		const { container } = render(LoadingSpinner, {
			props: { color: 'white' }
		});

		const spinner = container.querySelector('[class*="spin"], [class*="load"], svg');
		expect(spinner).toHaveClass(/white/);
	});

	it('should render with gray color variant', () => {
		const { container } = render(LoadingSpinner, {
			props: { color: 'gray' }
		});

		const spinner = container.querySelector('[class*="spin"], [class*="load"], svg');
		expect(spinner).toHaveClass(/gray/);
	});
});

describe('LoadingSpinner Component - Custom Label', () => {
	it('should display custom label when provided', () => {
		render(LoadingSpinner, {
			props: { label: 'Loading entities...' }
		});

		expect(screen.getByText('Loading entities...')).toBeInTheDocument();
	});

	it('should display label below spinner', () => {
		const { container } = render(LoadingSpinner, {
			props: { label: 'Please wait' }
		});

		const label = screen.getByText('Please wait');
		const spinner = container.querySelector('[class*="spin"], [class*="load"], svg, [role="status"]');

		expect(label).toBeInTheDocument();
		expect(spinner).toBeInTheDocument();

		// Label should come after spinner in DOM
		expect(label.compareDocumentPosition(spinner!)).toBe(
			Node.DOCUMENT_POSITION_PRECEDING
		);
	});

	it('should not display label section when no label provided', () => {
		const { container } = render(LoadingSpinner);

		// Should only have sr-only text, not a visible label (check for p tag which is used for labels)
		const labelElement = container.querySelector('p');
		expect(labelElement).not.toBeInTheDocument();
	});

	it('should style label appropriately', () => {
		render(LoadingSpinner, {
			props: { label: 'Loading data' }
		});

		const label = screen.getByText('Loading data');
		// Label should have text styling classes
		expect(label).toHaveClass(/text/);
	});
});

describe('LoadingSpinner Component - Center Layout', () => {
	it('should center spinner when center prop is true', () => {
		const { container } = render(LoadingSpinner, {
			props: { center: true }
		});

		// Container should have flex centering classes
		const wrapper = container.firstChild as HTMLElement;
		expect(wrapper).toHaveClass(/flex|grid/);
		expect(wrapper).toHaveClass(/center|items-center|justify-center/);
	});

	it('should not center spinner when center prop is false', () => {
		const { container } = render(LoadingSpinner, {
			props: { center: false }
		});

		const wrapper = container.firstChild as HTMLElement;
		// Should render inline without centering
		expect(wrapper).not.toHaveClass(/justify-center/);
	});

	it('should center by default', () => {
		const { container } = render(LoadingSpinner);

		const wrapper = container.firstChild as HTMLElement;
		expect(wrapper).toHaveClass(/flex|grid/);
	});
});

describe('LoadingSpinner Component - Fullscreen Variant', () => {
	it('should render fullscreen overlay when fullscreen prop is true', () => {
		const { container } = render(LoadingSpinner, {
			props: { fullscreen: true }
		});

		const overlay = container.firstChild as HTMLElement;
		// Should have fixed positioning and cover full viewport
		expect(overlay).toHaveClass(/fixed|absolute/);
		expect(overlay).toHaveClass(/inset-0|top-0|left-0|right-0|bottom-0/);
	});

	it('should have backdrop overlay in fullscreen mode', () => {
		const { container } = render(LoadingSpinner, {
			props: { fullscreen: true }
		});

		const overlay = container.firstChild as HTMLElement;
		// Should have semi-transparent background
		expect(overlay).toHaveClass(/bg-|backdrop/);
	});

	it('should center spinner in fullscreen mode', () => {
		const { container } = render(LoadingSpinner, {
			props: { fullscreen: true }
		});

		const overlay = container.firstChild as HTMLElement;
		expect(overlay).toHaveClass(/center|items-center|justify-center/);
	});

	it('should render inline when fullscreen is false', () => {
		const { container } = render(LoadingSpinner, {
			props: { fullscreen: false }
		});

		const wrapper = container.firstChild as HTMLElement;
		expect(wrapper).not.toHaveClass(/fixed|absolute|inset-0/);
	});
});

describe('LoadingSpinner Component - Animation', () => {
	it('should have spinning animation class', () => {
		const { container } = render(LoadingSpinner);

		const spinner = container.querySelector('[class*="spin"], [class*="load"], [class*="animate"], svg');
		expect(spinner).toBeInTheDocument();
		// Should have animation class
		expect(spinner).toHaveClass(/animate-spin|spin|rotating/);
	});

	it('should use CSS animation for smooth rotation', () => {
		const { container } = render(LoadingSpinner);

		const spinner = container.querySelector('[class*="animate"]');
		expect(spinner).toBeInTheDocument();
	});
});

describe('LoadingSpinner Component - Props Combinations', () => {
	it('should handle multiple props together', () => {
		render(LoadingSpinner, {
			props: {
				size: 'lg',
				color: 'primary',
				label: 'Loading campaign...',
				center: true
			}
		});

		expect(screen.getByText('Loading campaign...')).toBeInTheDocument();
		const spinner = screen.getByRole('status');
		expect(spinner).toBeInTheDocument();
	});

	it('should handle fullscreen with label', () => {
		render(LoadingSpinner, {
			props: {
				fullscreen: true,
				label: 'Please wait while we load your data'
			}
		});

		expect(screen.getByText('Please wait while we load your data')).toBeInTheDocument();
	});

	it('should handle custom size with color', () => {
		const { container } = render(LoadingSpinner, {
			props: {
				size: 'lg',
				color: 'white'
			}
		});

		const spinner = container.querySelector('[class*="spin"], svg');
		expect(spinner).toBeInTheDocument();
	});
});

describe('LoadingSpinner Component - Accessibility', () => {
	it('should have role="status" for screen readers', () => {
		render(LoadingSpinner);

		const spinner = screen.getByRole('status');
		expect(spinner).toBeInTheDocument();
	});

	it('should have aria-live="polite" for screen reader announcements', () => {
		const { container } = render(LoadingSpinner);

		const spinner = container.querySelector('[role="status"]');
		expect(spinner).toHaveAttribute('aria-live', 'polite');
	});

	it('should have descriptive sr-only text by default', () => {
		render(LoadingSpinner);

		// Should have screen reader text
		const srText = screen.getByText(/loading/i);
		expect(srText).toBeInTheDocument();
		expect(srText.className).toMatch(/sr-only/);
	});

	it('should use custom label for screen readers when provided', () => {
		render(LoadingSpinner, {
			props: { label: 'Saving your changes' }
		});

		expect(screen.getByText('Saving your changes')).toBeInTheDocument();
	});

	it('should not be focusable', () => {
		const { container } = render(LoadingSpinner);

		const spinner = container.querySelector('[role="status"]');
		expect(spinner).not.toHaveAttribute('tabindex');
	});
});

describe('LoadingSpinner Component - Default Props', () => {
	it('should use sensible defaults when no props provided', () => {
		const { container } = render(LoadingSpinner);

		// Should render without errors
		expect(container).toBeInTheDocument();

		// Should have default size (medium)
		const spinner = container.querySelector('[class*="spin"], svg');
		expect(spinner).toBeInTheDocument();

		// Should not be fullscreen by default
		expect(container.firstChild).not.toHaveClass(/fixed|absolute/);
	});

	it('should have default ARIA label', () => {
		render(LoadingSpinner);

		const srText = screen.getByText(/loading/i);
		expect(srText).toBeInTheDocument();
	});
});
