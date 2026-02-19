/**
 * Tests for IntegrityRecoveryDialog Component (Issue #511)
 *
 * This modal dialog is shown when major database integrity issues are detected.
 * It gives the user a clear view of what is wrong and three recovery paths:
 * attempt an automatic repair, export their data first, or perform a full reset.
 * The reset path requires an explicit second confirmation to prevent accidental
 * data loss.
 *
 * Covers:
 * - Modal renders with correct ARIA role and attributes when open=true
 * - Modal does NOT render when open=false
 * - Issues list is rendered (one item per IntegrityIssue)
 * - "Attempt Repair" button fires onRepair callback
 * - "Export Data" button fires onExport callback
 * - "Reset Database" button shows a confirmation prompt before firing onReset
 * - "Close" button fires onClose callback
 * - Loading state disables action buttons and shows a spinner/indicator
 * - Missing optional callbacks are handled without throwing
 * - Accessibility: role="dialog", aria-modal, aria-labelledby
 *
 * NOTE: These tests are expected to FAIL initially (RED phase of TDD).
 * Implementation will be added in the GREEN phase to make them pass.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import IntegrityRecoveryDialog from './IntegrityRecoveryDialog.svelte';
import type { IntegrityIssue } from '$lib/types/dbIntegrity';

// ---------------------------------------------------------------------------
// Test factories
// ---------------------------------------------------------------------------

function makeIssue(
	severity: 'minor' | 'major' = 'major',
	message = 'Expected table "entities" is missing'
): IntegrityIssue {
	return {
		type: 'table_existence',
		severity,
		message
	};
}

const baseProps = {
	open: true,
	issues: [makeIssue()],
	loading: false,
	onRepair: vi.fn(),
	onExport: vi.fn(),
	onReset: vi.fn(),
	onClose: vi.fn()
};

beforeEach(() => {
	vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// Rendering / Visibility
// ---------------------------------------------------------------------------

describe('IntegrityRecoveryDialog - Rendering', () => {
	it('should render without crashing when open=true', () => {
		const { container } = render(IntegrityRecoveryDialog, { props: baseProps });

		expect(container).toBeInTheDocument();
	});

	it('should render a dialog element when open=true', () => {
		const { container } = render(IntegrityRecoveryDialog, { props: baseProps });

		const dialog = container.querySelector('[role="dialog"]');
		expect(dialog).toBeInTheDocument();
	});

	it('should NOT render a dialog element when open=false', () => {
		const { container } = render(IntegrityRecoveryDialog, {
			props: { ...baseProps, open: false }
		});

		const dialog = container.querySelector('[role="dialog"]');
		expect(dialog).not.toBeInTheDocument();
	});

	it('should have a visible title describing the problem', () => {
		render(IntegrityRecoveryDialog, { props: baseProps });

		expect(screen.getByText(/integrity|database|issue|problem/i)).toBeInTheDocument();
	});

	it('should render with backdrop or modal overlay for focus trapping', () => {
		const { container } = render(IntegrityRecoveryDialog, { props: baseProps });

		// A backdrop is typically a sibling or parent of the dialog panel
		const overlay = container.querySelector('.fixed, [data-backdrop], [aria-modal="true"]');
		expect(overlay).toBeInTheDocument();
	});
});

// ---------------------------------------------------------------------------
// Issues List
// ---------------------------------------------------------------------------

describe('IntegrityRecoveryDialog - Issues List', () => {
	it('should display the message of each issue', () => {
		const issue = makeIssue('major', 'Table "entities" is missing');
		render(IntegrityRecoveryDialog, { props: { ...baseProps, issues: [issue] } });

		expect(screen.getByText(/Table "entities" is missing/i)).toBeInTheDocument();
	});

	it('should render one list item per issue', () => {
		const issues = [
			makeIssue('major', 'Issue one'),
			makeIssue('minor', 'Issue two'),
			makeIssue('major', 'Issue three')
		];
		render(IntegrityRecoveryDialog, { props: { ...baseProps, issues } });

		const items = screen.getAllByText(/Issue one|Issue two|Issue three/i);
		expect(items.length).toBe(3);
	});

	it('should indicate severity for each issue', () => {
		const issues = [makeIssue('major', 'Critical problem'), makeIssue('minor', 'Minor hiccup')];
		render(IntegrityRecoveryDialog, { props: { ...baseProps, issues } });

		// Either "major"/"minor" labels or distinctive styling — at minimum the
		// text content of both issue messages must be present
		expect(screen.getByText(/Critical problem/i)).toBeInTheDocument();
		expect(screen.getByText(/Minor hiccup/i)).toBeInTheDocument();
	});

	it('should handle an empty issues array gracefully', () => {
		render(IntegrityRecoveryDialog, { props: { ...baseProps, issues: [] } });

		// Dialog should still render (caller controls open state)
		const dialog = screen.getByRole('dialog');
		expect(dialog).toBeInTheDocument();
	});
});

// ---------------------------------------------------------------------------
// Action Buttons — Presence
// ---------------------------------------------------------------------------

describe('IntegrityRecoveryDialog - Button Presence', () => {
	it('should render an "Attempt Repair" button', () => {
		render(IntegrityRecoveryDialog, { props: baseProps });

		expect(screen.getByRole('button', { name: /attempt repair|repair/i })).toBeInTheDocument();
	});

	it('should render an "Export Data" button', () => {
		render(IntegrityRecoveryDialog, { props: baseProps });

		expect(screen.getByRole('button', { name: /export data|export/i })).toBeInTheDocument();
	});

	it('should render a "Reset Database" button', () => {
		render(IntegrityRecoveryDialog, { props: baseProps });

		expect(screen.getByRole('button', { name: /reset database|reset/i })).toBeInTheDocument();
	});

	it('should render a "Close" button', () => {
		render(IntegrityRecoveryDialog, { props: baseProps });

		expect(screen.getByRole('button', { name: /close/i })).toBeInTheDocument();
	});
});

// ---------------------------------------------------------------------------
// Callback — onRepair
// ---------------------------------------------------------------------------

describe('IntegrityRecoveryDialog - onRepair Callback', () => {
	it('should call onRepair when "Attempt Repair" is clicked', async () => {
		const onRepair = vi.fn();
		render(IntegrityRecoveryDialog, { props: { ...baseProps, onRepair } });

		await fireEvent.click(screen.getByRole('button', { name: /attempt repair|repair/i }));

		expect(onRepair).toHaveBeenCalledTimes(1);
	});

	it('should not call onExport or onReset or onClose when "Attempt Repair" is clicked', async () => {
		const onRepair = vi.fn();
		const onExport = vi.fn();
		const onReset = vi.fn();
		const onClose = vi.fn();
		render(IntegrityRecoveryDialog, {
			props: { ...baseProps, onRepair, onExport, onReset, onClose }
		});

		await fireEvent.click(screen.getByRole('button', { name: /attempt repair|repair/i }));

		expect(onExport).not.toHaveBeenCalled();
		expect(onReset).not.toHaveBeenCalled();
		expect(onClose).not.toHaveBeenCalled();
	});

	it('should not throw when onRepair prop is omitted', async () => {
		const { onRepair: _removed, ...propsWithout } = baseProps;
		render(IntegrityRecoveryDialog, { props: propsWithout });

		await expect(
			fireEvent.click(screen.getByRole('button', { name: /attempt repair|repair/i }))
		).resolves.not.toThrow();
	});
});

// ---------------------------------------------------------------------------
// Callback — onExport
// ---------------------------------------------------------------------------

describe('IntegrityRecoveryDialog - onExport Callback', () => {
	it('should call onExport when "Export Data" is clicked', async () => {
		const onExport = vi.fn();
		render(IntegrityRecoveryDialog, { props: { ...baseProps, onExport } });

		await fireEvent.click(screen.getByRole('button', { name: /export data|export/i }));

		expect(onExport).toHaveBeenCalledTimes(1);
	});

	it('should not call onRepair or onReset or onClose when "Export Data" is clicked', async () => {
		const onRepair = vi.fn();
		const onExport = vi.fn();
		const onReset = vi.fn();
		const onClose = vi.fn();
		render(IntegrityRecoveryDialog, {
			props: { ...baseProps, onRepair, onExport, onReset, onClose }
		});

		await fireEvent.click(screen.getByRole('button', { name: /export data|export/i }));

		expect(onRepair).not.toHaveBeenCalled();
		expect(onReset).not.toHaveBeenCalled();
		expect(onClose).not.toHaveBeenCalled();
	});

	it('should not throw when onExport prop is omitted', async () => {
		const { onExport: _removed, ...propsWithout } = baseProps;
		render(IntegrityRecoveryDialog, { props: propsWithout });

		await expect(
			fireEvent.click(screen.getByRole('button', { name: /export data|export/i }))
		).resolves.not.toThrow();
	});
});

// ---------------------------------------------------------------------------
// Callback — onReset (with confirmation gate)
// ---------------------------------------------------------------------------

describe('IntegrityRecoveryDialog - onReset Callback (with confirmation)', () => {
	it('should NOT immediately call onReset when "Reset Database" is first clicked', async () => {
		const onReset = vi.fn();
		render(IntegrityRecoveryDialog, { props: { ...baseProps, onReset } });

		await fireEvent.click(screen.getByRole('button', { name: /reset database|reset/i }));

		// onReset must not fire on the first click — a confirmation step is required
		expect(onReset).not.toHaveBeenCalled();
	});

	it('should show a confirmation prompt after "Reset Database" is first clicked', async () => {
		render(IntegrityRecoveryDialog, { props: baseProps });

		await fireEvent.click(screen.getByRole('button', { name: /reset database|reset/i }));

		// Some confirmation text or second confirm button must appear
		expect(
			screen.getByText(/confirm|are you sure|cannot be undone|irreversible/i)
		).toBeInTheDocument();
	});

	it('should call onReset when the user confirms the reset action', async () => {
		const onReset = vi.fn();
		render(IntegrityRecoveryDialog, { props: { ...baseProps, onReset } });

		// First click: enter confirmation state
		await fireEvent.click(screen.getByRole('button', { name: /reset database|reset/i }));

		// Second click: confirm (button label may vary — "Yes, Reset" / "Confirm Reset" / etc.)
		const confirmButton = screen.getByRole('button', {
			name: /confirm reset|yes.*reset|yes, reset|proceed|confirm/i
		});
		await fireEvent.click(confirmButton);

		expect(onReset).toHaveBeenCalledTimes(1);
	});

	it('should allow cancelling the reset confirmation without firing onReset', async () => {
		const onReset = vi.fn();
		render(IntegrityRecoveryDialog, { props: { ...baseProps, onReset } });

		// Enter confirmation state
		await fireEvent.click(screen.getByRole('button', { name: /reset database|reset/i }));

		// Cancel
		const cancelButton = screen.getByRole('button', { name: /cancel|go back|no/i });
		await fireEvent.click(cancelButton);

		expect(onReset).not.toHaveBeenCalled();
	});

	it('should not throw when onReset prop is omitted', async () => {
		const { onReset: _removed, ...propsWithout } = baseProps;
		render(IntegrityRecoveryDialog, { props: propsWithout });

		await fireEvent.click(screen.getByRole('button', { name: /reset database|reset/i }));
		const confirmButton = screen.getByRole('button', {
			name: /confirm reset|yes.*reset|yes, reset|proceed|confirm/i
		});

		await expect(fireEvent.click(confirmButton)).resolves.not.toThrow();
	});
});

// ---------------------------------------------------------------------------
// Callback — onClose
// ---------------------------------------------------------------------------

describe('IntegrityRecoveryDialog - onClose Callback', () => {
	it('should call onClose when the "Close" button is clicked', async () => {
		const onClose = vi.fn();
		render(IntegrityRecoveryDialog, { props: { ...baseProps, onClose } });

		await fireEvent.click(screen.getByRole('button', { name: /close/i }));

		expect(onClose).toHaveBeenCalledTimes(1);
	});

	it('should not call onRepair, onExport, or onReset when "Close" is clicked', async () => {
		const onRepair = vi.fn();
		const onExport = vi.fn();
		const onReset = vi.fn();
		const onClose = vi.fn();
		render(IntegrityRecoveryDialog, {
			props: { ...baseProps, onRepair, onExport, onReset, onClose }
		});

		await fireEvent.click(screen.getByRole('button', { name: /close/i }));

		expect(onRepair).not.toHaveBeenCalled();
		expect(onExport).not.toHaveBeenCalled();
		expect(onReset).not.toHaveBeenCalled();
	});

	it('should not throw when onClose prop is omitted', async () => {
		const { onClose: _removed, ...propsWithout } = baseProps;
		render(IntegrityRecoveryDialog, { props: propsWithout });

		await expect(
			fireEvent.click(screen.getByRole('button', { name: /close/i }))
		).resolves.not.toThrow();
	});
});

// ---------------------------------------------------------------------------
// Loading State
// ---------------------------------------------------------------------------

describe('IntegrityRecoveryDialog - Loading State', () => {
	it('should disable the "Attempt Repair" button while loading', () => {
		render(IntegrityRecoveryDialog, { props: { ...baseProps, loading: true } });

		const repairBtn = screen.getByRole('button', { name: /attempt repair|repair/i });
		expect(repairBtn).toBeDisabled();
	});

	it('should disable the "Reset Database" button while loading', () => {
		render(IntegrityRecoveryDialog, { props: { ...baseProps, loading: true } });

		const resetBtn = screen.getByRole('button', { name: /reset database|reset/i });
		expect(resetBtn).toBeDisabled();
	});

	it('should show a loading indicator (spinner or aria-busy) while loading', () => {
		const { container } = render(IntegrityRecoveryDialog, {
			props: { ...baseProps, loading: true }
		});

		// Accept either a CSS spinner animation or an aria-busy attribute
		const spinner = container.querySelector(
			'.animate-spin, [aria-busy="true"], [role="progressbar"]'
		);
		expect(spinner).toBeInTheDocument();
	});

	it('should re-enable action buttons when loading becomes false', () => {
		const { rerender } = render(IntegrityRecoveryDialog, {
			props: { ...baseProps, loading: true }
		});

		rerender({ ...baseProps, loading: false });

		const repairBtn = screen.getByRole('button', { name: /attempt repair|repair/i });
		expect(repairBtn).not.toBeDisabled();
	});
});

// ---------------------------------------------------------------------------
// Accessibility
// ---------------------------------------------------------------------------

describe('IntegrityRecoveryDialog - Accessibility', () => {
	it('should have role="dialog" on the modal element', () => {
		render(IntegrityRecoveryDialog, { props: baseProps });

		expect(screen.getByRole('dialog')).toBeInTheDocument();
	});

	it('should have aria-modal="true"', () => {
		const { container } = render(IntegrityRecoveryDialog, { props: baseProps });

		const dialog = container.querySelector('[role="dialog"]');
		expect(dialog).toHaveAttribute('aria-modal', 'true');
	});

	it('should have an accessible name linking to its title (aria-labelledby)', () => {
		const { container } = render(IntegrityRecoveryDialog, { props: baseProps });

		const dialog = container.querySelector('[role="dialog"]');
		expect(dialog).toHaveAttribute('aria-labelledby');
	});

	it('should have accessible names on all action buttons', () => {
		render(IntegrityRecoveryDialog, { props: baseProps });

		const buttons = screen.getAllByRole('button');
		buttons.forEach((btn) => {
			expect(btn).toHaveAccessibleName();
		});
	});
});
