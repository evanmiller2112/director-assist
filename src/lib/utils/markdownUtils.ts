/**
 * Markdown Utilities
 *
 * Issue #13: Add Markdown Editor for Rich Text Fields
 *
 * Provides sanitization for user-generated markdown content
 * to prevent XSS attacks while preserving safe markdown formatting.
 */

import { browser } from '$app/environment';
import type DOMPurifyType from 'dompurify';

// DOMPurify is loaded only in browser environments
let DOMPurify: typeof DOMPurifyType | null = null;
let initPromise: Promise<void> | null = null;

// Auto-initialize in browser
if (browser) {
	initPromise = import('dompurify').then(m => {
		DOMPurify = m.default;
	});
}

// DOMPurify configuration
const DOMPURIFY_CONFIG = {
	// Allow common HTML elements used in markdown
	ALLOWED_TAGS: [
		'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
		'p', 'br', 'hr',
		'strong', 'em', 'b', 'i', 'u', 's', 'del',
		'code', 'pre',
		'a',
		'img',
		'ul', 'ol', 'li',
		'blockquote',
		'table', 'thead', 'tbody', 'tr', 'th', 'td',
		'div', 'span'
	],
	// Allow safe attributes
	ALLOWED_ATTR: [
		'href', 'src', 'alt', 'title',
		'class', 'id',
		'target', 'rel',
		'align', 'colspan', 'rowspan'
	],
	// Do not allow data attributes
	ALLOW_DATA_ATTR: false,
	// Keep relative URLs
	ALLOW_UNKNOWN_PROTOCOLS: false,
	// Return the entire document
	WHOLE_DOCUMENT: false,
	// Return as a string
	RETURN_DOM: false,
	RETURN_DOM_FRAGMENT: false,
	// Force body output
	FORCE_BODY: false,
	// Keep HTML safe by default
	KEEP_CONTENT: true,
	// Sanitize inline styles
	SANITIZE_NAMED_PROPS: true,
	// Disable the addition of user-content- prefix to IDs
	SANITIZE_NAMED_PROPS_PREFIX: '',
	// Do not add prefixes to IDs
	ADD_TAGS: [],
	ADD_ATTR: []
};

/**
 * Basic sanitization for SSR - removes obvious XSS vectors
 */
function basicSanitize(html: string): string {
	let sanitized = html;
	// Remove script tags
	sanitized = sanitized.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
	// Remove event handlers
	sanitized = sanitized.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '');
	// Remove javascript: protocol
	sanitized = sanitized.replace(/href\s*=\s*["']javascript:[^"']*["']/gi, '');
	sanitized = sanitized.replace(/src\s*=\s*["']javascript:[^"']*["']/gi, '');
	// Remove data:text/html URLs
	sanitized = sanitized.replace(/href\s*=\s*["']data:text\/html[^"']*["']/gi, '');
	sanitized = sanitized.replace(/src\s*=\s*["']data:text\/html[^"']*["']/gi, '');
	return sanitized;
}

/**
 * Sanitizes HTML content to prevent XSS attacks.
 * Removes script tags, event handlers, and dangerous URLs while preserving safe HTML elements.
 *
 * @param html - The HTML string to sanitize
 * @returns The sanitized HTML string safe for rendering
 */
export function sanitizeHtml(html: string | null | undefined): string {
	// Handle null, undefined, or empty input
	if (!html) {
		return '';
	}

	// During SSR, use basic regex sanitization
	// Full DOMPurify sanitization happens on client hydration
	if (!browser || !DOMPurify) {
		return basicSanitize(html);
	}

	// Hook to prevent DOMPurify from adding 'user-content-' prefix to IDs
	DOMPurify.addHook('afterSanitizeAttributes', function (node) {
		// Remove user-content- prefix from id attributes
		if (node.hasAttribute && node.hasAttribute('id')) {
			const id = node.getAttribute('id');
			if (id && id.startsWith('user-content-')) {
				node.setAttribute('id', id.replace('user-content-', ''));
			}
		}
	});

	// First pass: sanitize with config
	let sanitized = DOMPurify.sanitize(html, DOMPURIFY_CONFIG);

	// Remove hook to prevent side effects
	DOMPurify.removeAllHooks();

	// Second pass: additional cleanup
	sanitized = basicSanitize(sanitized);

	return sanitized;
}

/**
 * Initialize DOMPurify - call this on app startup in the browser
 * Returns a promise that resolves when DOMPurify is ready
 */
export async function initSanitizer(): Promise<void> {
	if (initPromise) {
		await initPromise;
	}
}
