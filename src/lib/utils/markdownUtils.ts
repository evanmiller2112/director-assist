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
 * Decodes HTML entities in a string so protocol checks work even when
 * an attacker encodes characters like 'a' as '&#97;' or '&amp;'.
 * Only decodes numeric and named character references — does not parse tags.
 */
function decodeHtmlEntities(text: string): string {
	return text
		// Decimal numeric references: &#97; → a
		.replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(Number(dec)))
		// Hex numeric references: &#x61; → a
		.replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
		// Common named references that are relevant to URL/protocol sanitization
		.replace(/&amp;/gi, '&')
		.replace(/&lt;/gi, '<')
		.replace(/&gt;/gi, '>')
		.replace(/&quot;/gi, '"')
		.replace(/&apos;/gi, "'");
}

/**
 * Basic sanitization for SSR - removes obvious XSS vectors.
 *
 * This is also applied as a second pass after DOMPurify in browser contexts
 * to catch anything DOMPurify may have missed.
 *
 * Handles:
 * - Script tags (including unclosed and malformed variants)
 * - Event handler attributes (onclick, onload, etc.)
 * - Dangerous URL protocols (javascript:, vbscript:) including entity-encoded forms
 * - data:text/html URLs
 */
function basicSanitize(html: string): string {
	let sanitized = html;

	// Remove <script> tags in all forms:
	//   1. Well-formed:  <script ...>...</script>
	//   2. Unclosed:     <script ...>...EOF
	//   3. Malformed closing tag: <script>bad</>
	// Strategy: remove everything from an opening <script to the next </script>,
	// and then strip any remaining <script opening tags (catches unclosed / malformed).
	sanitized = sanitized.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
	sanitized = sanitized.replace(/<script[^>]*>[\s\S]*/gi, '');
	sanitized = sanitized.replace(/<script[^>]*>/gi, '');

	// Remove event handlers (onclick=, onload=, etc.)
	sanitized = sanitized.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '');

	// Decode HTML entities within attribute values before protocol checks.
	// We target only the content inside href/src quotes to avoid mangling
	// safe entity-encoded display text like &lt;div&gt;.
	sanitized = sanitized.replace(
		/(href|src)\s*=\s*(["'])(.*?)\2/gi,
		(_match, attr, quote, value) => {
			const decoded = decodeHtmlEntities(value);
			// Check for dangerous protocols (strip whitespace/control chars attackers
			// may inject between the protocol name and the colon)
			const normalised = decoded.replace(/[\s\u0000-\u001f]+/g, '').toLowerCase();
			if (
				normalised.startsWith('javascript:') ||
				normalised.startsWith('vbscript:') ||
				normalised.startsWith('data:text/html')
			) {
				return '';
			}
			// Value is safe — return the original (un-decoded) attribute so we
			// don't accidentally alter safe entity-encoded text.
			return _match;
		}
	);

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
