/**
 * Markdown Utilities
 *
 * Issue #13: Add Markdown Editor for Rich Text Fields
 *
 * Provides sanitization for user-generated markdown content
 * to prevent XSS attacks while preserving safe markdown formatting.
 */

import DOMPurify from 'isomorphic-dompurify';

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

	// Configure DOMPurify to allow safe HTML elements and attributes
	const config = {
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
	let sanitized = DOMPurify.sanitize(html, config);

	// Remove hook to prevent side effects
	DOMPurify.removeAllHooks();

	// Second pass: specifically remove any dangerous URIs and attributes that may have gotten through
	// Remove any remaining event handlers (onerror, onclick, etc.)
	sanitized = sanitized.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '');
	// Remove data:text/html URLs
	sanitized = sanitized.replace(/href\s*=\s*["']data:text\/html[^"']*["']/gi, '');
	sanitized = sanitized.replace(/src\s*=\s*["']data:text\/html[^"']*["']/gi, '');
	// Remove javascript: protocol
	sanitized = sanitized.replace(/href\s*=\s*["']javascript:[^"']*["']/gi, '');
	sanitized = sanitized.replace(/src\s*=\s*["']javascript:[^"']*["']/gi, '');
	// Remove any remaining script tags
	sanitized = sanitized.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');

	return sanitized;
}
