/**
 * Tests for Markdown Utilities
 *
 * Issue #13: Add Markdown Editor for Rich Text Fields
 *
 * RED Phase (TDD): These tests define expected behavior before implementation.
 * Tests will FAIL until markdownUtils.ts is implemented.
 *
 * These utilities provide sanitization for user-generated markdown content
 * to prevent XSS attacks while preserving safe markdown formatting.
 */

import { describe, it, expect } from 'vitest';
import { sanitizeHtml } from '$lib/utils/markdownUtils';

describe('markdownUtils - sanitizeHtml function', () => {
	describe('XSS Prevention - Script Tags', () => {
		it('should remove script tags from HTML', () => {
			const input = '<p>Hello</p><script>alert("xss")</script><p>World</p>';
			const result = sanitizeHtml(input);

			expect(result).not.toContain('<script>');
			expect(result).not.toContain('alert');
			expect(result).toContain('Hello');
			expect(result).toContain('World');
		});

		it('should remove inline script tags', () => {
			const input = '<script>console.log("malicious")</script>';
			const result = sanitizeHtml(input);

			expect(result).not.toContain('<script>');
			expect(result).not.toContain('console.log');
		});

		it('should remove script tags with attributes', () => {
			const input = '<script type="text/javascript" src="evil.js"></script>';
			const result = sanitizeHtml(input);

			expect(result).not.toContain('<script');
			expect(result).not.toContain('evil.js');
		});

		it('should remove multiple script tags', () => {
			const input = '<script>alert(1)</script><p>Safe</p><script>alert(2)</script>';
			const result = sanitizeHtml(input);

			expect(result).not.toContain('<script>');
			expect(result).not.toContain('alert');
			expect(result).toContain('Safe');
		});

		it('should handle nested script tags', () => {
			const input = '<div><script>alert("nested")</script></div>';
			const result = sanitizeHtml(input);

			expect(result).not.toContain('<script>');
			expect(result).not.toContain('alert');
		});
	});

	describe('XSS Prevention - Event Handlers', () => {
		it('should remove onclick event handlers', () => {
			const input = '<button onclick="alert(\'xss\')">Click me</button>';
			const result = sanitizeHtml(input);

			expect(result).not.toContain('onclick');
			expect(result).not.toContain('alert');
		});

		it('should remove onload event handlers', () => {
			const input = '<img src="x" onload="alert(\'xss\')" />';
			const result = sanitizeHtml(input);

			expect(result).not.toContain('onload');
			expect(result).not.toContain('alert');
		});

		it('should remove onerror event handlers', () => {
			const input = '<img src="x" onerror="alert(\'xss\')" />';
			const result = sanitizeHtml(input);

			expect(result).not.toContain('onerror');
			expect(result).not.toContain('alert');
		});

		it('should remove onmouseover event handlers', () => {
			const input = '<div onmouseover="maliciousFunction()">Hover me</div>';
			const result = sanitizeHtml(input);

			expect(result).not.toContain('onmouseover');
			expect(result).not.toContain('maliciousFunction');
		});

		it('should remove multiple event handlers from same element', () => {
			const input = '<a href="#" onclick="bad()" onmouseover="worse()">Link</a>';
			const result = sanitizeHtml(input);

			expect(result).not.toContain('onclick');
			expect(result).not.toContain('onmouseover');
			expect(result).not.toContain('bad()');
			expect(result).not.toContain('worse()');
		});

		it('should remove event handlers with various capitalizations', () => {
			const input = '<div onClick="alert(1)" ONLOAD="alert(2)">Test</div>';
			const result = sanitizeHtml(input);

			expect(result).not.toContain('onClick');
			expect(result).not.toContain('ONLOAD');
		});
	});

	describe('XSS Prevention - JavaScript URLs', () => {
		it('should remove javascript: protocol from href', () => {
			const input = '<a href="javascript:alert(\'xss\')">Click</a>';
			const result = sanitizeHtml(input);

			expect(result).not.toContain('javascript:');
			expect(result).not.toContain('alert');
		});

		it('should remove javascript: protocol from src attributes', () => {
			const input = '<img src="javascript:alert(\'xss\')" />';
			const result = sanitizeHtml(input);

			expect(result).not.toContain('javascript:');
		});

		it('should remove javascript: with various encodings', () => {
			const input = '<a href="j&#97;vascript:alert(1)">Link</a>';
			const result = sanitizeHtml(input);

			// Should not contain encoded or decoded javascript:
			expect(result).not.toContain('javascript:');
			expect(result).not.toContain('&#97;');
		});

		it('should remove data: URLs with text/html', () => {
			const input = '<a href="data:text/html,<script>alert(1)</script>">Link</a>';
			const result = sanitizeHtml(input);

			expect(result).not.toContain('data:text/html');
			expect(result).not.toContain('<script>');
		});

		it('should remove vbscript: protocol', () => {
			const input = '<a href="vbscript:msgbox(1)">Link</a>';
			const result = sanitizeHtml(input);

			expect(result).not.toContain('vbscript:');
		});
	});

	describe('Safe HTML Preservation - Block Elements', () => {
		it('should preserve paragraph tags', () => {
			const input = '<p>This is a paragraph</p>';
			const result = sanitizeHtml(input);

			expect(result).toContain('<p>');
			expect(result).toContain('This is a paragraph');
			expect(result).toContain('</p>');
		});

		it('should preserve heading tags', () => {
			const headings = [
				'<h1>Heading 1</h1>',
				'<h2>Heading 2</h2>',
				'<h3>Heading 3</h3>',
				'<h4>Heading 4</h4>',
				'<h5>Heading 5</h5>',
				'<h6>Heading 6</h6>'
			];

			headings.forEach((heading) => {
				const result = sanitizeHtml(heading);
				expect(result).toContain(heading);
			});
		});

		it('should preserve div tags', () => {
			const input = '<div>Content in div</div>';
			const result = sanitizeHtml(input);

			expect(result).toContain('<div>');
			expect(result).toContain('Content in div');
			expect(result).toContain('</div>');
		});

		it('should preserve blockquote tags', () => {
			const input = '<blockquote>Quote text</blockquote>';
			const result = sanitizeHtml(input);

			expect(result).toContain('<blockquote>');
			expect(result).toContain('Quote text');
			expect(result).toContain('</blockquote>');
		});

		it('should preserve pre and code tags', () => {
			const input = '<pre><code>const x = 1;</code></pre>';
			const result = sanitizeHtml(input);

			expect(result).toContain('<pre>');
			expect(result).toContain('<code>');
			expect(result).toContain('const x = 1;');
			expect(result).toContain('</code>');
			expect(result).toContain('</pre>');
		});
	});

	describe('Safe HTML Preservation - Inline Elements', () => {
		it('should preserve strong/bold tags', () => {
			const input = '<p>This is <strong>bold</strong> text</p>';
			const result = sanitizeHtml(input);

			expect(result).toContain('<strong>');
			expect(result).toContain('bold');
			expect(result).toContain('</strong>');
		});

		it('should preserve em/italic tags', () => {
			const input = '<p>This is <em>italic</em> text</p>';
			const result = sanitizeHtml(input);

			expect(result).toContain('<em>');
			expect(result).toContain('italic');
			expect(result).toContain('</em>');
		});

		it('should preserve inline code tags', () => {
			const input = '<p>Use <code>console.log()</code> for debugging</p>';
			const result = sanitizeHtml(input);

			expect(result).toContain('<code>');
			expect(result).toContain('console.log()');
			expect(result).toContain('</code>');
		});

		it('should preserve span tags', () => {
			const input = '<span>Inline text</span>';
			const result = sanitizeHtml(input);

			expect(result).toContain('<span>');
			expect(result).toContain('Inline text');
			expect(result).toContain('</span>');
		});

		it('should preserve br tags', () => {
			const input = '<p>Line 1<br>Line 2</p>';
			const result = sanitizeHtml(input);

			expect(result).toContain('<br');
		});
	});

	describe('Safe HTML Preservation - Lists', () => {
		it('should preserve unordered lists', () => {
			const input = '<ul><li>Item 1</li><li>Item 2</li></ul>';
			const result = sanitizeHtml(input);

			expect(result).toContain('<ul>');
			expect(result).toContain('<li>');
			expect(result).toContain('Item 1');
			expect(result).toContain('Item 2');
			expect(result).toContain('</li>');
			expect(result).toContain('</ul>');
		});

		it('should preserve ordered lists', () => {
			const input = '<ol><li>First</li><li>Second</li></ol>';
			const result = sanitizeHtml(input);

			expect(result).toContain('<ol>');
			expect(result).toContain('<li>');
			expect(result).toContain('First');
			expect(result).toContain('Second');
			expect(result).toContain('</ol>');
		});

		it('should preserve nested lists', () => {
			const input = '<ul><li>Item 1<ul><li>Nested</li></ul></li></ul>';
			const result = sanitizeHtml(input);

			expect(result).toContain('Item 1');
			expect(result).toContain('Nested');
		});
	});

	describe('Safe HTML Preservation - Links and Images', () => {
		it('should preserve safe links with http protocol', () => {
			const input = '<a href="http://example.com">Link</a>';
			const result = sanitizeHtml(input);

			expect(result).toContain('<a');
			expect(result).toContain('href="http://example.com"');
			expect(result).toContain('Link');
			expect(result).toContain('</a>');
		});

		it('should preserve safe links with https protocol', () => {
			const input = '<a href="https://example.com">Secure Link</a>';
			const result = sanitizeHtml(input);

			expect(result).toContain('<a');
			expect(result).toContain('href="https://example.com"');
			expect(result).toContain('Secure Link');
		});

		it('should preserve relative links', () => {
			const input = '<a href="/page">Internal Link</a>';
			const result = sanitizeHtml(input);

			expect(result).toContain('<a');
			expect(result).toContain('href="/page"');
			expect(result).toContain('Internal Link');
		});

		it('should preserve anchor links', () => {
			const input = '<a href="#section">Jump to section</a>';
			const result = sanitizeHtml(input);

			expect(result).toContain('<a');
			expect(result).toContain('href="#section"');
		});

		it('should preserve images with safe src', () => {
			const input = '<img src="https://example.com/image.png" alt="Description" />';
			const result = sanitizeHtml(input);

			expect(result).toContain('<img');
			expect(result).toContain('src="https://example.com/image.png"');
			expect(result).toContain('alt="Description"');
		});

		it('should preserve images with data URLs', () => {
			const input = '<img src="data:image/png;base64,iVBORw0K" alt="Base64 Image" />';
			const result = sanitizeHtml(input);

			expect(result).toContain('<img');
			expect(result).toContain('data:image/png;base64');
		});
	});

	describe('Safe HTML Preservation - Tables', () => {
		it('should preserve table structure', () => {
			const input = '<table><thead><tr><th>Header</th></tr></thead><tbody><tr><td>Cell</td></tr></tbody></table>';
			const result = sanitizeHtml(input);

			expect(result).toContain('<table>');
			expect(result).toContain('<thead>');
			expect(result).toContain('<tbody>');
			expect(result).toContain('<tr>');
			expect(result).toContain('<th>');
			expect(result).toContain('<td>');
			expect(result).toContain('Header');
			expect(result).toContain('Cell');
		});
	});

	describe('Edge Cases - Empty and Null Input', () => {
		it('should handle null input', () => {
			const result = sanitizeHtml(null as any);

			expect(result).toBe('');
		});

		it('should handle undefined input', () => {
			const result = sanitizeHtml(undefined as any);

			expect(result).toBe('');
		});

		it('should handle empty string input', () => {
			const result = sanitizeHtml('');

			expect(result).toBe('');
		});

		it('should handle whitespace-only input', () => {
			const result = sanitizeHtml('   \n\t   ');

			expect(result).toBeTruthy();
		});

		it('should handle plain text without HTML', () => {
			const input = 'Just plain text with no HTML tags';
			const result = sanitizeHtml(input);

			expect(result).toBe(input);
		});
	});

	describe('Edge Cases - Mixed Content', () => {
		it('should sanitize mixed safe and unsafe content', () => {
			const input = '<p>Safe paragraph</p><script>alert("xss")</script><p>Another safe one</p>';
			const result = sanitizeHtml(input);

			expect(result).toContain('Safe paragraph');
			expect(result).toContain('Another safe one');
			expect(result).not.toContain('<script>');
			expect(result).not.toContain('alert');
		});

		it('should handle complex nested safe elements', () => {
			const input = '<div><p>Paragraph with <strong>bold</strong> and <em>italic</em></p><ul><li>List item</li></ul></div>';
			const result = sanitizeHtml(input);

			expect(result).toContain('<div>');
			expect(result).toContain('<p>');
			expect(result).toContain('<strong>');
			expect(result).toContain('<em>');
			expect(result).toContain('<ul>');
			expect(result).toContain('<li>');
		});

		it('should handle element with safe and unsafe attributes', () => {
			const input = '<a href="https://example.com" onclick="alert(1)" class="link">Link</a>';
			const result = sanitizeHtml(input);

			expect(result).toContain('href="https://example.com"');
			expect(result).not.toContain('onclick');
			expect(result).not.toContain('alert(1)');
		});

		it('should preserve HTML entities', () => {
			const input = '<p>&lt;div&gt; &amp; &quot;quotes&quot;</p>';
			const result = sanitizeHtml(input);

			expect(result).toContain('&lt;');
			expect(result).toContain('&gt;');
			expect(result).toContain('&amp;');
			expect(result).toContain('&quot;');
		});

		it('should handle special characters', () => {
			const input = '<p>Special chars: © ™ € £ ¥</p>';
			const result = sanitizeHtml(input);

			expect(result).toContain('©');
			expect(result).toContain('™');
			expect(result).toContain('€');
		});
	});

	describe('Edge Cases - Malformed HTML', () => {
		it('should handle unclosed tags', () => {
			const input = '<p>Unclosed paragraph<script>alert(1)';
			const result = sanitizeHtml(input);

			expect(result).not.toContain('<script>');
			expect(result).not.toContain('alert');
		});

		it('should handle tags with invalid syntax', () => {
			const input = '<p>Text</><script>bad</>';
			const result = sanitizeHtml(input);

			expect(result).not.toContain('<script>');
		});

		it('should handle self-closing tags incorrectly closed', () => {
			const input = '<img src="test.png"></img>';
			const result = sanitizeHtml(input);

			expect(result).toContain('src="test.png"');
		});
	});

	describe('Edge Cases - Very Long Content', () => {
		it('should handle very long strings efficiently', () => {
			const longContent = '<p>' + 'a'.repeat(10000) + '</p>';
			const result = sanitizeHtml(longContent);

			expect(result).toContain('<p>');
			expect(result.length).toBeGreaterThan(10000);
		});

		it('should handle many repeated elements', () => {
			const manyParagraphs = Array(100).fill('<p>Paragraph</p>').join('');
			const result = sanitizeHtml(manyParagraphs);

			expect(result).toContain('<p>Paragraph</p>');
		});
	});

	describe('Safe Attributes - Class and Style', () => {
		it('should preserve class attributes', () => {
			const input = '<p class="text-bold text-large">Styled text</p>';
			const result = sanitizeHtml(input);

			expect(result).toContain('class="text-bold text-large"');
		});

		it('should preserve id attributes', () => {
			const input = '<div id="main-content">Content</div>';
			const result = sanitizeHtml(input);

			expect(result).toContain('id="main-content"');
		});

		it('should handle safe style attributes', () => {
			const input = '<span style="color: blue;">Blue text</span>';
			const result = sanitizeHtml(input);

			// Style handling depends on implementation - may be preserved or stripped
			// Document the expected behavior
			expect(result).toContain('Blue text');
		});
	});

	describe('Real-world Markdown HTML Output', () => {
		it('should handle typical markdown-generated HTML', () => {
			const input = `
				<h1>Title</h1>
				<p>Paragraph with <strong>bold</strong> and <em>italic</em>.</p>
				<ul>
					<li>Item 1</li>
					<li>Item 2</li>
				</ul>
				<pre><code class="language-javascript">const x = 1;</code></pre>
				<blockquote>
					<p>A quote</p>
				</blockquote>
			`;
			const result = sanitizeHtml(input);

			expect(result).toContain('<h1>Title</h1>');
			expect(result).toContain('<strong>bold</strong>');
			expect(result).toContain('<em>italic</em>');
			expect(result).toContain('<ul>');
			expect(result).toContain('<li>');
			expect(result).toContain('<code');
			expect(result).toContain('const x = 1;');
			expect(result).toContain('<blockquote>');
		});

		it('should sanitize markdown HTML with XSS attempts', () => {
			const input = `
				<h1>Normal Header</h1>
				<p>Safe content</p>
				<script>alert("Injected!")</script>
				<img src="x" onerror="alert('XSS')" />
				<a href="javascript:void(0)">Bad Link</a>
			`;
			const result = sanitizeHtml(input);

			expect(result).toContain('<h1>Normal Header</h1>');
			expect(result).toContain('Safe content');
			expect(result).not.toContain('<script>');
			expect(result).not.toContain('onerror');
			expect(result).not.toContain('javascript:');
			expect(result).not.toContain('alert');
		});
	});
});
