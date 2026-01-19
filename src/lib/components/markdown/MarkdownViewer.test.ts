/**
 * Tests for MarkdownViewer Component
 *
 * Issue #13: Add Markdown Editor for Rich Text Fields
 *
 * RED Phase (TDD): These tests define expected behavior before implementation.
 * Tests will FAIL until MarkdownViewer.svelte is implemented.
 *
 * The MarkdownViewer component renders markdown content as HTML in a read-only view.
 * It handles markdown parsing, HTML sanitization, and safe rendering.
 *
 * Component Props:
 * - content: string (markdown content to render)
 * - class?: string (additional CSS classes)
 * - sanitize?: boolean (whether to sanitize HTML, default: true)
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import MarkdownViewer from './MarkdownViewer.svelte';

describe('MarkdownViewer Component - Basic Rendering (Issue #13)', () => {
	it('should render without crashing', () => {
		const { container } = render(MarkdownViewer, {
			props: { content: 'Hello World' }
		});
		expect(container).toBeInTheDocument();
	});

	it('should render empty content gracefully', () => {
		const { container } = render(MarkdownViewer, {
			props: { content: '' }
		});
		expect(container).toBeInTheDocument();
	});

	it('should render plain text content', () => {
		render(MarkdownViewer, {
			props: { content: 'Just plain text' }
		});

		expect(screen.getByText('Just plain text')).toBeInTheDocument();
	});

	it('should render as a div container', () => {
		const { container } = render(MarkdownViewer, {
			props: { content: 'Content' }
		});

		const wrapper = container.querySelector('div');
		expect(wrapper).toBeInTheDocument();
	});
});

describe('MarkdownViewer Component - Headings', () => {
	it('should render H1 headings', () => {
		render(MarkdownViewer, {
			props: { content: '# Heading 1' }
		});

		const heading = screen.getByRole('heading', { level: 1 });
		expect(heading).toBeInTheDocument();
		expect(heading).toHaveTextContent('Heading 1');
	});

	it('should render H2 headings', () => {
		render(MarkdownViewer, {
			props: { content: '## Heading 2' }
		});

		const heading = screen.getByRole('heading', { level: 2 });
		expect(heading).toBeInTheDocument();
		expect(heading).toHaveTextContent('Heading 2');
	});

	it('should render H3 headings', () => {
		render(MarkdownViewer, {
			props: { content: '### Heading 3' }
		});

		const heading = screen.getByRole('heading', { level: 3 });
		expect(heading).toBeInTheDocument();
		expect(heading).toHaveTextContent('Heading 3');
	});

	it('should render multiple headings', () => {
		const content = `# Title\n## Subtitle\n### Section`;
		render(MarkdownViewer, {
			props: { content }
		});

		expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Title');
		expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Subtitle');
		expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('Section');
	});

	it('should render H4, H5, and H6 headings', () => {
		const content = `#### H4\n##### H5\n###### H6`;
		render(MarkdownViewer, {
			props: { content }
		});

		expect(screen.getByRole('heading', { level: 4 })).toHaveTextContent('H4');
		expect(screen.getByRole('heading', { level: 5 })).toHaveTextContent('H5');
		expect(screen.getByRole('heading', { level: 6 })).toHaveTextContent('H6');
	});
});

describe('MarkdownViewer Component - Paragraphs', () => {
	it('should render paragraphs', () => {
		render(MarkdownViewer, {
			props: { content: 'This is a paragraph.' }
		});

		expect(screen.getByText('This is a paragraph.')).toBeInTheDocument();
	});

	it('should render multiple paragraphs', () => {
		const content = 'First paragraph.\n\nSecond paragraph.';
		render(MarkdownViewer, {
			props: { content }
		});

		expect(screen.getByText('First paragraph.')).toBeInTheDocument();
		expect(screen.getByText('Second paragraph.')).toBeInTheDocument();
	});

	it('should handle line breaks within paragraphs', () => {
		const content = 'Line one  \nLine two';
		render(MarkdownViewer, {
			props: { content }
		});

		expect(screen.getByText(/Line one/)).toBeInTheDocument();
		expect(screen.getByText(/Line two/)).toBeInTheDocument();
	});
});

describe('MarkdownViewer Component - Inline Formatting', () => {
	it('should render bold text with **', () => {
		render(MarkdownViewer, {
			props: { content: 'This is **bold** text' }
		});

		const boldText = screen.getByText('bold');
		expect(boldText).toBeInTheDocument();
		expect(boldText.tagName.toLowerCase()).toBe('strong');
	});

	it('should render bold text with __', () => {
		render(MarkdownViewer, {
			props: { content: 'This is __bold__ text' }
		});

		const boldText = screen.getByText('bold');
		expect(boldText).toBeInTheDocument();
	});

	it('should render italic text with *', () => {
		render(MarkdownViewer, {
			props: { content: 'This is *italic* text' }
		});

		const italicText = screen.getByText('italic');
		expect(italicText).toBeInTheDocument();
		expect(italicText.tagName.toLowerCase()).toBe('em');
	});

	it('should render italic text with _', () => {
		render(MarkdownViewer, {
			props: { content: 'This is _italic_ text' }
		});

		const italicText = screen.getByText('italic');
		expect(italicText).toBeInTheDocument();
	});

	it('should render bold and italic combined', () => {
		render(MarkdownViewer, {
			props: { content: 'This is ***bold and italic*** text' }
		});

		expect(screen.getByText('bold and italic')).toBeInTheDocument();
	});

	it('should render inline code with backticks', () => {
		render(MarkdownViewer, {
			props: { content: 'Use `console.log()` for debugging' }
		});

		const code = screen.getByText('console.log()');
		expect(code).toBeInTheDocument();
		expect(code.tagName.toLowerCase()).toBe('code');
	});

	it('should render strikethrough text', () => {
		render(MarkdownViewer, {
			props: { content: 'This is ~~strikethrough~~ text' }
		});

		expect(screen.getByText('strikethrough')).toBeInTheDocument();
	});
});

describe('MarkdownViewer Component - Lists', () => {
	it('should render unordered lists', () => {
		const content = `- Item 1\n- Item 2\n- Item 3`;
		render(MarkdownViewer, {
			props: { content }
		});

		expect(screen.getByText('Item 1')).toBeInTheDocument();
		expect(screen.getByText('Item 2')).toBeInTheDocument();
		expect(screen.getByText('Item 3')).toBeInTheDocument();

		const list = screen.getByRole('list');
		expect(list.tagName.toLowerCase()).toBe('ul');
	});

	it('should render ordered lists', () => {
		const content = `1. First\n2. Second\n3. Third`;
		render(MarkdownViewer, {
			props: { content }
		});

		expect(screen.getByText('First')).toBeInTheDocument();
		expect(screen.getByText('Second')).toBeInTheDocument();
		expect(screen.getByText('Third')).toBeInTheDocument();

		const list = screen.getByRole('list');
		expect(list.tagName.toLowerCase()).toBe('ol');
	});

	it('should render nested lists', () => {
		const content = `- Item 1\n  - Nested 1\n  - Nested 2\n- Item 2`;
		render(MarkdownViewer, {
			props: { content }
		});

		expect(screen.getByText('Item 1')).toBeInTheDocument();
		expect(screen.getByText('Nested 1')).toBeInTheDocument();
		expect(screen.getByText('Nested 2')).toBeInTheDocument();
		expect(screen.getByText('Item 2')).toBeInTheDocument();
	});

	it('should render list items with inline formatting', () => {
		const content = `- **Bold** item\n- *Italic* item\n- \`Code\` item`;
		render(MarkdownViewer, {
			props: { content }
		});

		expect(screen.getByText('Bold')).toBeInTheDocument();
		expect(screen.getByText('Italic')).toBeInTheDocument();
		expect(screen.getByText('Code')).toBeInTheDocument();
	});
});

describe('MarkdownViewer Component - Links', () => {
	it('should render links', () => {
		render(MarkdownViewer, {
			props: { content: '[Click here](https://example.com)' }
		});

		const link = screen.getByRole('link', { name: 'Click here' });
		expect(link).toBeInTheDocument();
		expect(link).toHaveAttribute('href', 'https://example.com');
	});

	it('should render multiple links', () => {
		const content = '[Link 1](https://example.com) and [Link 2](https://test.com)';
		render(MarkdownViewer, {
			props: { content }
		});

		const link1 = screen.getByRole('link', { name: 'Link 1' });
		const link2 = screen.getByRole('link', { name: 'Link 2' });

		expect(link1).toHaveAttribute('href', 'https://example.com');
		expect(link2).toHaveAttribute('href', 'https://test.com');
	});

	it('should render links with inline formatting', () => {
		render(MarkdownViewer, {
			props: { content: '[**Bold Link**](https://example.com)' }
		});

		const link = screen.getByRole('link');
		expect(link).toBeInTheDocument();
		expect(link).toHaveAttribute('href', 'https://example.com');
	});

	it('should render relative links', () => {
		render(MarkdownViewer, {
			props: { content: '[Internal](/page)' }
		});

		const link = screen.getByRole('link', { name: 'Internal' });
		expect(link).toHaveAttribute('href', '/page');
	});

	it('should render anchor links', () => {
		render(MarkdownViewer, {
			props: { content: '[Jump to section](#section)' }
		});

		const link = screen.getByRole('link', { name: 'Jump to section' });
		expect(link).toHaveAttribute('href', '#section');
	});

	it('should open external links in new tab', () => {
		render(MarkdownViewer, {
			props: { content: '[External](https://example.com)' }
		});

		const link = screen.getByRole('link', { name: 'External' });
		expect(link).toHaveAttribute('target', '_blank');
		expect(link).toHaveAttribute('rel', 'noopener noreferrer');
	});

	it('should not open relative links in new tab', () => {
		render(MarkdownViewer, {
			props: { content: '[Internal](/page)' }
		});

		const link = screen.getByRole('link', { name: 'Internal' });
		expect(link).not.toHaveAttribute('target', '_blank');
	});
});

describe('MarkdownViewer Component - Code Blocks', () => {
	it('should render code blocks', () => {
		const content = '```\nconst x = 1;\nconsole.log(x);\n```';
		render(MarkdownViewer, {
			props: { content }
		});

		expect(screen.getByText(/const x = 1/)).toBeInTheDocument();
		expect(screen.getByText(/console.log/)).toBeInTheDocument();
	});

	it('should render code blocks with language specified', () => {
		const content = '```javascript\nconst x = 1;\n```';
		render(MarkdownViewer, {
			props: { content }
		});

		expect(screen.getByText(/const x = 1/)).toBeInTheDocument();
	});

	it('should preserve indentation in code blocks', () => {
		const content = '```\nfunction test() {\n  return true;\n}\n```';
		render(MarkdownViewer, {
			props: { content }
		});

		expect(screen.getByText(/function test/)).toBeInTheDocument();
		expect(screen.getByText(/return true/)).toBeInTheDocument();
	});

	it('should not interpret markdown inside code blocks', () => {
		const content = '```\n**not bold**\n*not italic*\n```';
		render(MarkdownViewer, {
			props: { content }
		});

		expect(screen.getByText(/\*\*not bold\*\*/)).toBeInTheDocument();
		expect(screen.getByText(/\*not italic\*/)).toBeInTheDocument();
	});
});

describe('MarkdownViewer Component - Blockquotes', () => {
	it('should render blockquotes', () => {
		render(MarkdownViewer, {
			props: { content: '> This is a quote' }
		});

		expect(screen.getByText('This is a quote')).toBeInTheDocument();
	});

	it('should render multi-line blockquotes', () => {
		const content = '> Line 1\n> Line 2\n> Line 3';
		render(MarkdownViewer, {
			props: { content }
		});

		expect(screen.getByText(/Line 1/)).toBeInTheDocument();
		expect(screen.getByText(/Line 2/)).toBeInTheDocument();
		expect(screen.getByText(/Line 3/)).toBeInTheDocument();
	});

	it('should render nested blockquotes', () => {
		const content = '> Outer quote\n>> Nested quote';
		render(MarkdownViewer, {
			props: { content }
		});

		expect(screen.getByText(/Outer quote/)).toBeInTheDocument();
		expect(screen.getByText(/Nested quote/)).toBeInTheDocument();
	});

	it('should render blockquotes with inline formatting', () => {
		const content = '> This is **bold** in a quote';
		render(MarkdownViewer, {
			props: { content }
		});

		const boldText = screen.getByText('bold');
		expect(boldText.tagName.toLowerCase()).toBe('strong');
	});
});

describe('MarkdownViewer Component - Horizontal Rules', () => {
	it('should render horizontal rules with ---', () => {
		const { container } = render(MarkdownViewer, {
			props: { content: 'Above\n\n---\n\nBelow' }
		});

		const hr = container.querySelector('hr');
		expect(hr).toBeInTheDocument();
	});

	it('should render horizontal rules with ***', () => {
		const { container } = render(MarkdownViewer, {
			props: { content: 'Above\n\n***\n\nBelow' }
		});

		const hr = container.querySelector('hr');
		expect(hr).toBeInTheDocument();
	});

	it('should render horizontal rules with ___', () => {
		const { container } = render(MarkdownViewer, {
			props: { content: 'Above\n\n___\n\nBelow' }
		});

		const hr = container.querySelector('hr');
		expect(hr).toBeInTheDocument();
	});
});

describe('MarkdownViewer Component - Images', () => {
	it('should render images', () => {
		render(MarkdownViewer, {
			props: { content: '![Alt text](https://example.com/image.png)' }
		});

		const img = screen.getByRole('img', { name: 'Alt text' });
		expect(img).toBeInTheDocument();
		expect(img).toHaveAttribute('src', 'https://example.com/image.png');
		expect(img).toHaveAttribute('alt', 'Alt text');
	});

	it('should render images without alt text', () => {
		const { container } = render(MarkdownViewer, {
			props: { content: '![](https://example.com/image.png)' }
		});

		const img = container.querySelector('img');
		expect(img).toBeInTheDocument();
		expect(img).toHaveAttribute('src', 'https://example.com/image.png');
	});

	it('should render images with title attribute', () => {
		render(MarkdownViewer, {
			props: { content: '![Alt](https://example.com/image.png "Title text")' }
		});

		const img = screen.getByRole('img', { name: 'Alt' });
		expect(img).toHaveAttribute('title', 'Title text');
	});
});

describe('MarkdownViewer Component - Sanitization', () => {
	it('should sanitize script tags by default', () => {
		const { container } = render(MarkdownViewer, {
			props: { content: '<script>alert("xss")</script>Hello' }
		});

		expect(container).not.toContainHTML('<script>');
		expect(container).not.toContainHTML('alert');
		expect(screen.getByText('Hello')).toBeInTheDocument();
	});

	it('should sanitize onclick handlers by default', () => {
		const { container } = render(MarkdownViewer, {
			props: { content: '<div onclick="alert(1)">Click</div>' }
		});

		expect(container).not.toContainHTML('onclick');
		expect(container).not.toContainHTML('alert');
		expect(screen.getByText('Click')).toBeInTheDocument();
	});

	it('should sanitize javascript: URLs by default', () => {
		const { container } = render(MarkdownViewer, {
			props: { content: '[Link](javascript:alert("xss"))' }
		});

		expect(container).not.toContainHTML('javascript:');
	});

	it('should sanitize onerror handlers by default', () => {
		const { container } = render(MarkdownViewer, {
			props: { content: '<img src="x" onerror="alert(1)" />' }
		});

		expect(container).not.toContainHTML('onerror');
		expect(container).not.toContainHTML('alert');
	});

	it('should preserve safe HTML when sanitizing', () => {
		render(MarkdownViewer, {
			props: { content: '<p>Safe <strong>HTML</strong></p>' }
		});

		expect(screen.getByText('HTML')).toBeInTheDocument();
		const strong = screen.getByText('HTML');
		expect(strong.tagName.toLowerCase()).toBe('strong');
	});

	it('should allow disabling sanitization with sanitize prop', () => {
		const { container } = render(MarkdownViewer, {
			props: {
				content: '<div onclick="test()">Content</div>',
				sanitize: false
			}
		});

		// When sanitization is disabled, unsafe content should be preserved
		// (This is a feature for trusted content only)
		expect(container).toContainHTML('onclick');
	});

	it('should sanitize when sanitize prop is true', () => {
		const { container } = render(MarkdownViewer, {
			props: {
				content: '<script>alert(1)</script>Safe',
				sanitize: true
			}
		});

		expect(container).not.toContainHTML('<script>');
		expect(screen.getByText('Safe')).toBeInTheDocument();
	});

	it('should sanitize by default when sanitize prop is not provided', () => {
		const { container } = render(MarkdownViewer, {
			props: { content: '<script>alert(1)</script>Content' }
		});

		expect(container).not.toContainHTML('<script>');
	});
});

describe('MarkdownViewer Component - Custom Classes', () => {
	it('should accept custom CSS classes via class prop', () => {
		const { container } = render(MarkdownViewer, {
			props: {
				content: 'Content',
				class: 'custom-class another-class'
			}
		});

		const wrapper = container.querySelector('.custom-class');
		expect(wrapper).toBeInTheDocument();
		expect(wrapper).toHaveClass('custom-class', 'another-class');
	});

	it('should render without custom classes when class prop not provided', () => {
		const { container } = render(MarkdownViewer, {
			props: { content: 'Content' }
		});

		const wrapper = container.firstChild;
		expect(wrapper).toBeInTheDocument();
	});

	it('should merge custom classes with default classes', () => {
		const { container } = render(MarkdownViewer, {
			props: {
				content: 'Content',
				class: 'extra-padding'
			}
		});

		const wrapper = container.firstChild as HTMLElement;
		expect(wrapper).toHaveClass('extra-padding');
	});
});

describe('MarkdownViewer Component - Edge Cases', () => {
	it('should handle null content', () => {
		const { container } = render(MarkdownViewer, {
			props: { content: null as any }
		});

		expect(container).toBeInTheDocument();
	});

	it('should handle undefined content', () => {
		const { container } = render(MarkdownViewer, {
			props: { content: undefined as any }
		});

		expect(container).toBeInTheDocument();
	});

	it('should handle very long content', () => {
		const longContent = 'Word '.repeat(1000);
		render(MarkdownViewer, {
			props: { content: longContent }
		});

		expect(screen.getByText(/Word/)).toBeInTheDocument();
	});

	it('should handle content with special characters', () => {
		const content = 'Special chars: © ™ € £ ¥ <>&"';
		render(MarkdownViewer, {
			props: { content }
		});

		expect(screen.getByText(/Special chars/)).toBeInTheDocument();
	});

	it('should handle mixed markdown and HTML', () => {
		const content = '**Bold markdown** and <strong>HTML bold</strong>';
		render(MarkdownViewer, {
			props: { content }
		});

		expect(screen.getByText('Bold markdown')).toBeInTheDocument();
		expect(screen.getByText('HTML bold')).toBeInTheDocument();
	});

	it('should handle malformed markdown gracefully', () => {
		const content = '**unclosed bold\n*unclosed italic\n[unclosed link';
		render(MarkdownViewer, {
			props: { content }
		});

		expect(screen.getByText(/unclosed/)).toBeInTheDocument();
	});

	it('should handle empty lines and whitespace', () => {
		const content = '\n\n\nContent\n\n\n';
		render(MarkdownViewer, {
			props: { content }
		});

		expect(screen.getByText('Content')).toBeInTheDocument();
	});
});

describe('MarkdownViewer Component - Tables', () => {
	it('should render markdown tables', () => {
		const content = `
| Header 1 | Header 2 |
|----------|----------|
| Cell 1   | Cell 2   |
| Cell 3   | Cell 4   |
		`;
		render(MarkdownViewer, {
			props: { content }
		});

		expect(screen.getByText('Header 1')).toBeInTheDocument();
		expect(screen.getByText('Header 2')).toBeInTheDocument();
		expect(screen.getByText('Cell 1')).toBeInTheDocument();
		expect(screen.getByText('Cell 2')).toBeInTheDocument();
		expect(screen.getByText('Cell 3')).toBeInTheDocument();
		expect(screen.getByText('Cell 4')).toBeInTheDocument();
	});

	it('should render tables with alignment', () => {
		const content = `
| Left | Center | Right |
|:-----|:------:|------:|
| L1   | C1     | R1    |
		`;
		render(MarkdownViewer, {
			props: { content }
		});

		expect(screen.getByText('Left')).toBeInTheDocument();
		expect(screen.getByText('Center')).toBeInTheDocument();
		expect(screen.getByText('Right')).toBeInTheDocument();
	});
});

describe('MarkdownViewer Component - Task Lists', () => {
	it('should render task lists with checkboxes', () => {
		const content = `
- [ ] Unchecked task
- [x] Checked task
- [ ] Another unchecked
		`;
		render(MarkdownViewer, {
			props: { content }
		});

		expect(screen.getByText(/Unchecked task/)).toBeInTheDocument();
		expect(screen.getByText(/Checked task/)).toBeInTheDocument();
		expect(screen.getByText(/Another unchecked/)).toBeInTheDocument();
	});
});

describe('MarkdownViewer Component - Real-world Scenarios', () => {
	it('should render a complete character description', () => {
		const content = `
# Character Name: Eldrin Shadowblade

## Background
Eldrin is a **skilled rogue** from the *Shadowfen* district.

### Skills
- Stealth
- Lockpicking
- Acrobatics

### Equipment
1. Dagger +1
2. Lockpicks
3. Thieves' tools

> "In the shadows, we find our truth."

Visit [character sheet](https://example.com/eldrin) for more details.
		`;

		render(MarkdownViewer, {
			props: { content }
		});

		expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Character Name: Eldrin Shadowblade');
		expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Background');
		expect(screen.getByText('skilled rogue')).toBeInTheDocument();
		expect(screen.getByText('Shadowfen')).toBeInTheDocument();
		expect(screen.getByText('Stealth')).toBeInTheDocument();
		expect(screen.getByText('Lockpicking')).toBeInTheDocument();
		expect(screen.getByText(/In the shadows/)).toBeInTheDocument();
		expect(screen.getByRole('link', { name: 'character sheet' })).toBeInTheDocument();
	});

	it('should render markdown with code examples', () => {
		const content = `
# API Documentation

Use the following code:

\`\`\`javascript
const result = await fetch('/api/entities');
const data = await result.json();
\`\`\`

Then access the data with \`data.entities\`.
		`;

		render(MarkdownViewer, {
			props: { content }
		});

		expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('API Documentation');
		expect(screen.getByText(/const result = await fetch/)).toBeInTheDocument();
		expect(screen.getByText('data.entities')).toBeInTheDocument();
	});
});
