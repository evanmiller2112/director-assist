import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/svelte';
import Header from '$lib/components/layout/Header.svelte';
import Toast from '$lib/components/ui/Toast.svelte';

describe('Accessibility improvements', () => {
	it('header has aria-label', () => {
		const { container } = render(Header);
		const header = container.querySelector('header');
		expect(header?.getAttribute('aria-label')).toBe('Site header');
	});

	it('toast container has proper ARIA live region', () => {
		const { container } = render(Toast);
		const toastContainer = container.querySelector('[role="status"][aria-live="polite"]');
		expect(toastContainer).toBeTruthy();
	});
});
