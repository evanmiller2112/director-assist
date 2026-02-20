import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import AppVersion from './AppVersion.svelte';

/**
 * Tests for AppVersion Component
 *
 * Issue #560: Display app version in the UI
 *
 * This component displays the application version number from package.json.
 * It should be shown in the settings page footer for easy reference.
 *
 * These tests are written in the RED phase of TDD - they will FAIL until the
 * component is implemented.
 */

describe('AppVersion Component - Basic Rendering (Issue #560)', () => {
	it('should render without crashing', () => {
		const { container } = render(AppVersion);
		expect(container).toBeInTheDocument();
	});

	it('should display version text with "Director Assist v" prefix', () => {
		render(AppVersion);

		// Should display "Director Assist v0.0.0-test" (from mock)
		expect(screen.getByText(/Director Assist v/i)).toBeInTheDocument();
	});

	it('should display the complete version string', () => {
		render(AppVersion);

		// Should display full version including "Director Assist v" and version number
		// The version comes from package.json, so we check the pattern rather than exact match
		const versionElement = screen.getByTestId('app-version');
		expect(versionElement.textContent).toMatch(/^Director Assist v\d+\.\d+\.\d+/);
	});

	it('should render as small muted text', () => {
		const { container } = render(AppVersion);

		const versionElement = container.querySelector('p');
		expect(versionElement).toBeInTheDocument();
		expect(versionElement).toHaveClass('text-xs');
	});

	it('should have appropriate styling for light and dark modes', () => {
		const { container } = render(AppVersion);

		const versionElement = container.querySelector('p');
		expect(versionElement).toBeInTheDocument();

		// Should have muted text color for both light and dark modes
		expect(versionElement?.className).toMatch(/text-slate-400/);
		expect(versionElement?.className).toMatch(/dark:text-slate-500/);
	});

	it('should have data-testid for easy selection', () => {
		render(AppVersion);

		const versionElement = screen.getByTestId('app-version');
		expect(versionElement).toBeInTheDocument();
	});

	it('should include version prefix "v" in the displayed text', () => {
		render(AppVersion);

		const versionText = screen.getByTestId('app-version').textContent;
		// Should contain "v" followed by a version number
		expect(versionText).toMatch(/v\d+\.\d+\.\d+/);
	});
});

describe('AppVersion Component - Version Format', () => {
	it('should display version in semantic versioning format', () => {
		render(AppVersion);

		const versionText = screen.getByTestId('app-version').textContent;
		// Version should match pattern: v<major>.<minor>.<patch> or similar
		expect(versionText).toMatch(/v\d+\.\d+\.\d+/);
	});
});
