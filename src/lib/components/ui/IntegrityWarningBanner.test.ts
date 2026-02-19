/**
 * Tests for IntegrityWarningBanner Component (Issue #511)
 *
 * This banner surfaces minor database integrity issues to the user without
 * blocking the UI. It lets them export their data as a safety measure, view
 * fuller details in the recovery dialog, or simply dismiss the notice.
 *
 * Covers:
 * - Renders when visible with the correct ARIA role
 * - Does NOT render when not visible (conditional mount)
 * - Displays the count of issues found
 * - "Back Up Now" button fires onExport callback
 * - "View Details" button fires onViewDetails callback
 * - "Dismiss" button fires onDismiss callback
 * - Missing optional callbacks are handled without throwing
 * - Accessibility: role, aria-live, labelled buttons
 *
 * NOTE: These tests are expected to FAIL initially (RED phase of TDD).
 * Implementation will be added in the GREEN phase to make them pass.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import IntegrityWarningBanner from './IntegrityWarningBanner.svelte';
import type { IntegrityIssue } from '$lib/types/dbIntegrity';

// ---------------------------------------------------------------------------
// Shared test data
// ---------------------------------------------------------------------------

function makeMinorIssue(message = 'No active campaign set'): IntegrityIssue {
	return {
		type: 'active_campaign',
		severity: 'minor',
		message
	};
}

const defaultProps = {
	issues: [makeMinorIssue()],
	onExport: vi.fn(),
	onViewDetails: vi.fn(),
	onDismiss: vi.fn()
};

beforeEach(() => {
	vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// Basic Rendering
// ---------------------------------------------------------------------------

describe('IntegrityWarningBanner - Basic Rendering', () => {
	it('should render without crashing', () => {
		const { container } = render(IntegrityWarningBanner, { props: defaultProps });

		expect(container).toBeInTheDocument();
	});

	it('should render an alert or banner region', () => {
		const { container } = render(IntegrityWarningBanner, { props: defaultProps });

		const region = container.querySelector('[role="alert"], [role="banner"]');
		expect(region).toBeInTheDocument();
	});

	it('should include the word "integrity" or "warning" or "issue" in its text', () => {
		render(IntegrityWarningBanner, { props: defaultProps });

		expect(screen.getByText(/integrity|warning|issue/i)).toBeInTheDocument();
	});

	it('should have a background colour class for visual prominence', () => {
		const { container } = render(IntegrityWarningBanner, { props: defaultProps });

		const region = container.querySelector('[role="alert"], [role="banner"]');
		expect(region).toHaveClass(/bg-/);
	});

	it('should have padding for content spacing', () => {
		const { container } = render(IntegrityWarningBanner, { props: defaultProps });

		const region = container.querySelector('[role="alert"], [role="banner"]');
		expect(region).toHaveClass(/p-|px-|py-/);
	});
});

// ---------------------------------------------------------------------------
// Visibility / Conditional Rendering
// ---------------------------------------------------------------------------

describe('IntegrityWarningBanner - Visibility', () => {
	it('should not render any visible content when issues array is empty', () => {
		const { container } = render(IntegrityWarningBanner, {
			props: { ...defaultProps, issues: [] }
		});

		// Either nothing is mounted at all, or the alert region is absent
		const region = container.querySelector('[role="alert"], [role="banner"]');
		expect(region).not.toBeInTheDocument();
	});

	it('should render when there is at least one issue', () => {
		const { container } = render(IntegrityWarningBanner, { props: defaultProps });

		const region = container.querySelector('[role="alert"], [role="banner"]');
		expect(region).toBeInTheDocument();
	});
});

// ---------------------------------------------------------------------------
// Issue Count Display
// ---------------------------------------------------------------------------

describe('IntegrityWarningBanner - Issue Count', () => {
	it('should display the count of issues when there is one issue', () => {
		render(IntegrityWarningBanner, {
			props: { ...defaultProps, issues: [makeMinorIssue()] }
		});

		expect(screen.getByText(/1/)).toBeInTheDocument();
	});

	it('should display the count of issues when there are three issues', () => {
		render(IntegrityWarningBanner, {
			props: {
				...defaultProps,
				issues: [makeMinorIssue(), makeMinorIssue('Issue 2'), makeMinorIssue('Issue 3')]
			}
		});

		expect(screen.getByText(/3/)).toBeInTheDocument();
	});

	it('should display the count of issues when there are many issues', () => {
		const issues = Array.from({ length: 10 }, (_, i) => makeMinorIssue(`Issue ${i}`));
		render(IntegrityWarningBanner, { props: { ...defaultProps, issues } });

		expect(screen.getByText(/10/)).toBeInTheDocument();
	});
});

// ---------------------------------------------------------------------------
// Action Buttons — Presence
// ---------------------------------------------------------------------------

describe('IntegrityWarningBanner - Button Presence', () => {
	it('should render a "Back Up Now" or "Export" button', () => {
		render(IntegrityWarningBanner, { props: defaultProps });

		const btn = screen.getByRole('button', { name: /back up now|export/i });
		expect(btn).toBeInTheDocument();
	});

	it('should render a "View Details" button', () => {
		render(IntegrityWarningBanner, { props: defaultProps });

		const btn = screen.getByRole('button', { name: /view details|details/i });
		expect(btn).toBeInTheDocument();
	});

	it('should render a "Dismiss" or "Close" button', () => {
		render(IntegrityWarningBanner, { props: defaultProps });

		const btn = screen.getByRole('button', { name: /dismiss|close/i });
		expect(btn).toBeInTheDocument();
	});

	it('should render at least three buttons total', () => {
		render(IntegrityWarningBanner, { props: defaultProps });

		const buttons = screen.getAllByRole('button');
		expect(buttons.length).toBeGreaterThanOrEqual(3);
	});
});

// ---------------------------------------------------------------------------
// Callback — onExport
// ---------------------------------------------------------------------------

describe('IntegrityWarningBanner - onExport Callback', () => {
	it('should call onExport when the "Back Up Now" button is clicked', async () => {
		const onExport = vi.fn();
		render(IntegrityWarningBanner, { props: { ...defaultProps, onExport } });

		await fireEvent.click(screen.getByRole('button', { name: /back up now|export/i }));

		expect(onExport).toHaveBeenCalledTimes(1);
	});

	it('should not call onViewDetails or onDismiss when "Back Up Now" is clicked', async () => {
		const onExport = vi.fn();
		const onViewDetails = vi.fn();
		const onDismiss = vi.fn();
		render(IntegrityWarningBanner, { props: { ...defaultProps, onExport, onViewDetails, onDismiss } });

		await fireEvent.click(screen.getByRole('button', { name: /back up now|export/i }));

		expect(onViewDetails).not.toHaveBeenCalled();
		expect(onDismiss).not.toHaveBeenCalled();
	});

	it('should not throw when onExport prop is omitted', async () => {
		const { onExport: _removed, ...propsWithoutExport } = defaultProps;
		render(IntegrityWarningBanner, { props: propsWithoutExport });

		await expect(
			fireEvent.click(screen.getByRole('button', { name: /back up now|export/i }))
		).resolves.not.toThrow();
	});
});

// ---------------------------------------------------------------------------
// Callback — onViewDetails
// ---------------------------------------------------------------------------

describe('IntegrityWarningBanner - onViewDetails Callback', () => {
	it('should call onViewDetails when the "View Details" button is clicked', async () => {
		const onViewDetails = vi.fn();
		render(IntegrityWarningBanner, { props: { ...defaultProps, onViewDetails } });

		await fireEvent.click(screen.getByRole('button', { name: /view details|details/i }));

		expect(onViewDetails).toHaveBeenCalledTimes(1);
	});

	it('should not call onExport or onDismiss when "View Details" is clicked', async () => {
		const onExport = vi.fn();
		const onViewDetails = vi.fn();
		const onDismiss = vi.fn();
		render(IntegrityWarningBanner, { props: { ...defaultProps, onExport, onViewDetails, onDismiss } });

		await fireEvent.click(screen.getByRole('button', { name: /view details|details/i }));

		expect(onExport).not.toHaveBeenCalled();
		expect(onDismiss).not.toHaveBeenCalled();
	});

	it('should not throw when onViewDetails prop is omitted', async () => {
		const { onViewDetails: _removed, ...propsWithout } = defaultProps;
		render(IntegrityWarningBanner, { props: propsWithout });

		await expect(
			fireEvent.click(screen.getByRole('button', { name: /view details|details/i }))
		).resolves.not.toThrow();
	});
});

// ---------------------------------------------------------------------------
// Callback — onDismiss
// ---------------------------------------------------------------------------

describe('IntegrityWarningBanner - onDismiss Callback', () => {
	it('should call onDismiss when the "Dismiss" button is clicked', async () => {
		const onDismiss = vi.fn();
		render(IntegrityWarningBanner, { props: { ...defaultProps, onDismiss } });

		await fireEvent.click(screen.getByRole('button', { name: /dismiss|close/i }));

		expect(onDismiss).toHaveBeenCalledTimes(1);
	});

	it('should not call onExport or onViewDetails when "Dismiss" is clicked', async () => {
		const onExport = vi.fn();
		const onViewDetails = vi.fn();
		const onDismiss = vi.fn();
		render(IntegrityWarningBanner, { props: { ...defaultProps, onExport, onViewDetails, onDismiss } });

		await fireEvent.click(screen.getByRole('button', { name: /dismiss|close/i }));

		expect(onExport).not.toHaveBeenCalled();
		expect(onViewDetails).not.toHaveBeenCalled();
	});

	it('should not throw when onDismiss prop is omitted', async () => {
		const { onDismiss: _removed, ...propsWithout } = defaultProps;
		render(IntegrityWarningBanner, { props: propsWithout });

		await expect(
			fireEvent.click(screen.getByRole('button', { name: /dismiss|close/i }))
		).resolves.not.toThrow();
	});
});

// ---------------------------------------------------------------------------
// Accessibility
// ---------------------------------------------------------------------------

describe('IntegrityWarningBanner - Accessibility', () => {
	it('should have role="alert" or role="banner" for screen readers', () => {
		const { container } = render(IntegrityWarningBanner, { props: defaultProps });

		const region = container.querySelector('[role="alert"], [role="banner"]');
		expect(region).toBeInTheDocument();
	});

	it('should include an aria-live region so assistive tech announces the warning', () => {
		const { container } = render(IntegrityWarningBanner, { props: defaultProps });

		const live = container.querySelector('[aria-live]');
		expect(live).toBeInTheDocument();
	});

	it('should have accessible names on all action buttons', () => {
		render(IntegrityWarningBanner, { props: defaultProps });

		const buttons = screen.getAllByRole('button');
		buttons.forEach((btn) => {
			expect(btn).toHaveAccessibleName();
		});
	});

	it('should not mark any action button with tabindex="-1"', () => {
		render(IntegrityWarningBanner, { props: defaultProps });

		const buttons = screen.getAllByRole('button');
		buttons.forEach((btn) => {
			expect(btn).not.toHaveAttribute('tabindex', '-1');
		});
	});

	it('should include a warning icon (svg) for visual context', () => {
		const { container } = render(IntegrityWarningBanner, { props: defaultProps });

		const icon = container.querySelector('svg, [class*="icon"]');
		expect(icon).toBeInTheDocument();
	});
});
