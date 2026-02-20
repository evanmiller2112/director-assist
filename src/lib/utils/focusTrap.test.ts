import { describe, it, expect, beforeEach, vi } from 'vitest';
import { trapFocus } from './focusTrap';

describe('focusTrap', () => {
	let container: HTMLElement;

	beforeEach(() => {
		document.body.innerHTML = '';
		container = document.createElement('div');
		document.body.appendChild(container);
	});

	it('focuses first focusable element on init', () => {
		container.innerHTML = `
			<button id="first">First</button>
			<button id="second">Second</button>
		`;
		const first = container.querySelector('#first') as HTMLButtonElement;

		trapFocus(container);

		expect(document.activeElement).toBe(first);
	});

	it('traps forward Tab at the last element', () => {
		container.innerHTML = `
			<button id="first">First</button>
			<button id="last">Last</button>
		`;
		const first = container.querySelector('#first') as HTMLButtonElement;
		const last = container.querySelector('#last') as HTMLButtonElement;

		trapFocus(container);

		// Focus the last element
		last.focus();
		expect(document.activeElement).toBe(last);

		// Simulate Tab key
		const event = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true });
		container.dispatchEvent(event);

		expect(document.activeElement).toBe(first);
	});

	it('traps backward Shift+Tab at the first element', () => {
		container.innerHTML = `
			<button id="first">First</button>
			<button id="last">Last</button>
		`;
		const first = container.querySelector('#first') as HTMLButtonElement;
		const last = container.querySelector('#last') as HTMLButtonElement;

		trapFocus(container);

		// First element is focused on init
		expect(document.activeElement).toBe(first);

		// Simulate Shift+Tab
		const event = new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true });
		container.dispatchEvent(event);

		expect(document.activeElement).toBe(last);
	});

	it('cleanup restores previous focus', () => {
		const outsideButton = document.createElement('button');
		outsideButton.id = 'outside';
		document.body.appendChild(outsideButton);
		outsideButton.focus();
		expect(document.activeElement).toBe(outsideButton);

		container.innerHTML = '<button id="inside">Inside</button>';

		const cleanup = trapFocus(container);

		// Focus should move inside
		const inside = container.querySelector('#inside') as HTMLButtonElement;
		expect(document.activeElement).toBe(inside);

		// Cleanup should restore focus
		cleanup();
		expect(document.activeElement).toBe(outsideButton);
	});

	it('handles containers with no focusable elements', () => {
		container.innerHTML = '<div>No focusable elements</div>';

		const cleanup = trapFocus(container);

		// Should not throw
		const event = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true });
		container.dispatchEvent(event);

		cleanup();
	});

	it('does not trap non-Tab keys', () => {
		container.innerHTML = `
			<button id="first">First</button>
			<button id="last">Last</button>
		`;
		const first = container.querySelector('#first') as HTMLButtonElement;

		trapFocus(container);
		expect(document.activeElement).toBe(first);

		// Simulate Enter key (should not trap)
		const event = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true });
		container.dispatchEvent(event);

		// Focus should remain on first
		expect(document.activeElement).toBe(first);
	});
});
