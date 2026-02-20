import { writable, readable } from 'svelte/store';

// Type for page store
interface PageStore {
	url: URL;
	params: Record<string, string>;
	route: { id: string | null };
	status: number;
	error: Error | null;
	data: Record<string, unknown>;
	form: unknown;
}

// Create a writable page store that tests can control
export const page = writable<PageStore>({
	url: new URL('http://localhost'),
	params: { type: 'npc' }, // Default params for tests
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

// Helper to set URL search params for pagination tests
export function setPageUrl(url: string) {
	page.update(p => ({ ...p, url: new URL(url) }));
}

// Helper to set page status and error for error page tests
export function setPageError(status: number, error: Error | null) {
	page.update(p => ({ ...p, status, error }));
}

export const navigating = readable(null);
export const updated = readable(false);
