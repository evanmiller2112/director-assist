import { writable, readable } from 'svelte/store';

// Create a writable page store that tests can control
export const page = writable({
	url: new URL('http://localhost'),
	params: {},
	route: { id: null },
	status: 200,
	error: null,
	data: {},
	form: undefined
});

// Helper to reset page params for tests
export function setPageParams(params: Record<string, string>) {
	page.update(p => ({ ...p, params }));
}

export const navigating = readable(null);
export const updated = readable(false);
