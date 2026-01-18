/**
 * Tests for MarkdownEditor Component
 *
 * Issue #13: Add Markdown Editor for Rich Text Fields
 *
 * RED Phase (TDD): These tests define expected behavior before implementation.
 * Tests will FAIL until MarkdownEditor.svelte is implemented.
 *
 * The MarkdownEditor component provides a rich text editor with markdown support,
 * including a toolbar for formatting, live preview, and multiple editing modes.
 *
 * Component Props:
 * - value: string (two-way bindable markdown content)
 * - placeholder?: string (placeholder text for empty editor)
 * - disabled?: boolean (whether editor is disabled)
 * - readonly?: boolean (whether editor is read-only)
 * - mode?: 'edit' | 'preview' | 'split' (editing mode, default: 'split')
 * - minHeight?: string (minimum height, default: '150px')
 * - maxHeight?: string (maximum height, default: '400px')
 * - class?: string (additional CSS classes)
 * - showToolbar?: boolean (whether to show formatting toolbar, default: true)
 * - error?: string (error message to display)
 * - onchange?: (value: string) => void (callback when content changes)
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import MarkdownEditor from './MarkdownEditor.svelte';

describe('MarkdownEditor Component - Basic Rendering (Issue #13)', () => {
	it('should render without crashing', () => {
		const { container } = render(MarkdownEditor, {
			props: { value: '' }
		});
		expect(container).toBeInTheDocument();
	});

	it('should render with initial value', () => {
		render(MarkdownEditor, {
			props: { value: 'Initial content' }
		});

		const textarea = screen.getByDisplayValue('Initial content');
		expect(textarea).toBeInTheDocument();
	});

	it('should render as a textarea element for input', () => {
		render(MarkdownEditor, {
			props: { value: '' }
		});

		const textarea = screen.getByRole('textbox');
		expect(textarea).toBeInTheDocument();
		expect(textarea.tagName.toLowerCase()).toBe('textarea');
	});

	it('should render with empty value', () => {
		const { container } = render(MarkdownEditor, {
			props: { value: '' }
		});

		expect(container).toBeInTheDocument();
	});
});

describe('MarkdownEditor Component - Placeholder', () => {
	it('should display placeholder text when empty', () => {
		render(MarkdownEditor, {
			props: {
				value: '',
				placeholder: 'Enter markdown here...'
			}
		});

		const textarea = screen.getByPlaceholderText('Enter markdown here...');
		expect(textarea).toBeInTheDocument();
	});

	it('should not display placeholder when value is present', () => {
		render(MarkdownEditor, {
			props: {
				value: 'Content',
				placeholder: 'Enter markdown here...'
			}
		});

		const textarea = screen.getByDisplayValue('Content');
		expect(textarea).not.toHaveValue('');
	});

	it('should render without placeholder when not provided', () => {
		const { container } = render(MarkdownEditor, {
			props: { value: '' }
		});

		const textarea = screen.getByRole('textbox');
		expect(textarea).toBeInTheDocument();
	});
});

describe('MarkdownEditor Component - Value Binding', () => {
	it('should bind value to textarea', () => {
		render(MarkdownEditor, {
			props: { value: 'Test content' }
		});

		const textarea = screen.getByDisplayValue('Test content');
		expect(textarea).toHaveValue('Test content');
	});

	it('should update when value prop changes', async () => {
		const { rerender } = render(MarkdownEditor, {
			props: { value: 'Initial' }
		});

		expect(screen.getByDisplayValue('Initial')).toBeInTheDocument();

		await rerender({ value: 'Updated' });

		expect(screen.getByDisplayValue('Updated')).toBeInTheDocument();
	});

	it('should call onchange when content is typed', async () => {
		const onChange = vi.fn();

		render(MarkdownEditor, {
			props: {
				value: '',
				onchange: onChange
			}
		});

		const textarea = screen.getByRole('textbox');
		await fireEvent.input(textarea, { target: { value: 'New content' } });

		expect(onChange).toHaveBeenCalledWith('New content');
	});

	it('should call onchange multiple times for multiple edits', async () => {
		const onChange = vi.fn();

		render(MarkdownEditor, {
			props: {
				value: '',
				onchange: onChange
			}
		});

		const textarea = screen.getByRole('textbox');

		await fireEvent.input(textarea, { target: { value: 'First' } });
		await fireEvent.input(textarea, { target: { value: 'First edit' } });
		await fireEvent.input(textarea, { target: { value: 'First edit again' } });

		expect(onChange).toHaveBeenCalledTimes(3);
	});

	it('should handle rapid input changes', async () => {
		const onChange = vi.fn();

		render(MarkdownEditor, {
			props: {
				value: '',
				onchange: onChange
			}
		});

		const textarea = screen.getByRole('textbox');

		// Simulate rapid typing
		for (let i = 0; i < 10; i++) {
			await fireEvent.input(textarea, { target: { value: `Text ${i}` } });
		}

		expect(onChange).toHaveBeenCalledTimes(10);
	});
});

describe('MarkdownEditor Component - Editing Modes', () => {
	it('should render in split mode by default', () => {
		const { container } = render(MarkdownEditor, {
			props: { value: '# Test' }
		});

		// Should have both textarea and preview
		const textarea = screen.getByRole('textbox');
		expect(textarea).toBeInTheDocument();

		// Preview should show rendered markdown
		expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Test');
	});

	it('should render in edit-only mode', () => {
		const { container } = render(MarkdownEditor, {
			props: {
				value: '# Test',
				mode: 'edit'
			}
		});

		// Should have textarea
		const textarea = screen.getByRole('textbox');
		expect(textarea).toBeInTheDocument();

		// Should not have preview
		expect(screen.queryByRole('heading', { level: 1 })).not.toBeInTheDocument();
	});

	it('should render in preview-only mode', () => {
		render(MarkdownEditor, {
			props: {
				value: '# Test',
				mode: 'preview'
			}
		});

		// Should have preview
		expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Test');

		// Should not have visible textarea
		expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
	});

	it('should render in split mode', () => {
		render(MarkdownEditor, {
			props: {
				value: '**Bold**',
				mode: 'split'
			}
		});

		// Should have both textarea and preview
		const textarea = screen.getByRole('textbox');
		expect(textarea).toBeInTheDocument();

		const boldText = screen.getByText('Bold');
		expect(boldText.tagName.toLowerCase()).toBe('strong');
	});

	it('should switch between modes', async () => {
		const { rerender } = render(MarkdownEditor, {
			props: {
				value: '# Heading',
				mode: 'edit'
			}
		});

		// Initially in edit mode
		expect(screen.getByRole('textbox')).toBeInTheDocument();
		expect(screen.queryByRole('heading')).not.toBeInTheDocument();

		// Switch to preview mode
		await rerender({
			value: '# Heading',
			mode: 'preview'
		});

		expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
		expect(screen.queryByRole('textbox')).not.toBeInTheDocument();

		// Switch to split mode
		await rerender({
			value: '# Heading',
			mode: 'split'
		});

		expect(screen.getByRole('textbox')).toBeInTheDocument();
		expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
	});
});

describe('MarkdownEditor Component - Preview Pane', () => {
	it('should show live preview in split mode', () => {
		render(MarkdownEditor, {
			props: {
				value: '**Bold text**',
				mode: 'split'
			}
		});

		const boldText = screen.getByText('Bold text');
		expect(boldText.tagName.toLowerCase()).toBe('strong');
	});

	it('should update preview when content changes', async () => {
		const { rerender } = render(MarkdownEditor, {
			props: {
				value: '# Original',
				mode: 'split'
			}
		});

		expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Original');

		await rerender({
			value: '# Updated',
			mode: 'split'
		});

		expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Updated');
	});

	it('should render markdown formatting in preview', () => {
		render(MarkdownEditor, {
			props: {
				value: '**Bold** *italic* `code`',
				mode: 'split'
			}
		});

		expect(screen.getByText('Bold').tagName.toLowerCase()).toBe('strong');
		expect(screen.getByText('italic').tagName.toLowerCase()).toBe('em');
		expect(screen.getByText('code').tagName.toLowerCase()).toBe('code');
	});

	it('should sanitize preview content', () => {
		const { container } = render(MarkdownEditor, {
			props: {
				value: '<script>alert("xss")</script>Safe',
				mode: 'split'
			}
		});

		expect(container).not.toContainHTML('<script>');
		expect(screen.getByText('Safe')).toBeInTheDocument();
	});

	it('should handle empty content in preview', () => {
		const { container } = render(MarkdownEditor, {
			props: {
				value: '',
				mode: 'split'
			}
		});

		expect(container).toBeInTheDocument();
	});
});

describe('MarkdownEditor Component - Toolbar', () => {
	it('should show toolbar by default', () => {
		const { container } = render(MarkdownEditor, {
			props: { value: '' }
		});

		// Toolbar should have formatting buttons
		// Common buttons: Bold, Italic, Heading, Link, Code, List
		const toolbar = container.querySelector('[role="toolbar"]') || container.querySelector('[class*="toolbar"]');
		expect(toolbar).toBeInTheDocument();
	});

	it('should hide toolbar when showToolbar is false', () => {
		const { container } = render(MarkdownEditor, {
			props: {
				value: '',
				showToolbar: false
			}
		});

		const toolbar = container.querySelector('[role="toolbar"]') || container.querySelector('[class*="toolbar"]');
		expect(toolbar).not.toBeInTheDocument();
	});

	it('should have bold button in toolbar', () => {
		render(MarkdownEditor, {
			props: { value: '' }
		});

		const boldButton = screen.getByRole('button', { name: /bold/i });
		expect(boldButton).toBeInTheDocument();
	});

	it('should have italic button in toolbar', () => {
		render(MarkdownEditor, {
			props: { value: '' }
		});

		const italicButton = screen.getByRole('button', { name: /italic/i });
		expect(italicButton).toBeInTheDocument();
	});

	it('should have heading button in toolbar', () => {
		render(MarkdownEditor, {
			props: { value: '' }
		});

		const headingButton = screen.getByRole('button', { name: /heading/i });
		expect(headingButton).toBeInTheDocument();
	});

	it('should have code button in toolbar', () => {
		render(MarkdownEditor, {
			props: { value: '' }
		});

		const codeButton = screen.getByRole('button', { name: /code/i });
		expect(codeButton).toBeInTheDocument();
	});

	it('should have link button in toolbar', () => {
		render(MarkdownEditor, {
			props: { value: '' }
		});

		const linkButton = screen.getByRole('button', { name: /link/i });
		expect(linkButton).toBeInTheDocument();
	});

	it('should have list buttons in toolbar', () => {
		render(MarkdownEditor, {
			props: { value: '' }
		});

		const listButton = screen.getByRole('button', { name: /list/i });
		expect(listButton).toBeInTheDocument();
	});

	it('should insert bold markdown when bold button clicked', async () => {
		const onChange = vi.fn();

		render(MarkdownEditor, {
			props: {
				value: '',
				onchange: onChange
			}
		});

		const boldButton = screen.getByRole('button', { name: /bold/i });
		await fireEvent.click(boldButton);

		// Should insert bold syntax
		expect(onChange).toHaveBeenCalledWith(expect.stringContaining('**'));
	});

	it('should wrap selected text with bold markdown', async () => {
		const onChange = vi.fn();

		render(MarkdownEditor, {
			props: {
				value: 'selected text',
				onchange: onChange
			}
		});

		const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;

		// Select text
		textarea.setSelectionRange(0, 13);

		const boldButton = screen.getByRole('button', { name: /bold/i });
		await fireEvent.click(boldButton);

		expect(onChange).toHaveBeenCalledWith('**selected text**');
	});

	it('should insert italic markdown when italic button clicked', async () => {
		const onChange = vi.fn();

		render(MarkdownEditor, {
			props: {
				value: '',
				onchange: onChange
			}
		});

		const italicButton = screen.getByRole('button', { name: /italic/i });
		await fireEvent.click(italicButton);

		expect(onChange).toHaveBeenCalledWith(expect.stringContaining('*'));
	});

	it('should insert heading markdown when heading button clicked', async () => {
		const onChange = vi.fn();

		render(MarkdownEditor, {
			props: {
				value: '',
				onchange: onChange
			}
		});

		const headingButton = screen.getByRole('button', { name: /heading/i });
		await fireEvent.click(headingButton);

		expect(onChange).toHaveBeenCalledWith(expect.stringContaining('#'));
	});

	it('should disable toolbar buttons when editor is disabled', () => {
		render(MarkdownEditor, {
			props: {
				value: '',
				disabled: true
			}
		});

		const boldButton = screen.getByRole('button', { name: /bold/i });
		expect(boldButton).toBeDisabled();
	});

	it('should disable toolbar buttons when editor is readonly', () => {
		render(MarkdownEditor, {
			props: {
				value: '',
				readonly: true
			}
		});

		const boldButton = screen.getByRole('button', { name: /bold/i });
		expect(boldButton).toBeDisabled();
	});
});

describe('MarkdownEditor Component - Disabled State', () => {
	it('should disable textarea when disabled prop is true', () => {
		render(MarkdownEditor, {
			props: {
				value: '',
				disabled: true
			}
		});

		const textarea = screen.getByRole('textbox');
		expect(textarea).toBeDisabled();
	});

	it('should enable textarea when disabled prop is false', () => {
		render(MarkdownEditor, {
			props: {
				value: '',
				disabled: false
			}
		});

		const textarea = screen.getByRole('textbox');
		expect(textarea).not.toBeDisabled();
	});

	it('should not call onchange when disabled', async () => {
		const onChange = vi.fn();

		render(MarkdownEditor, {
			props: {
				value: '',
				disabled: true,
				onchange: onChange
			}
		});

		const textarea = screen.getByRole('textbox');
		await fireEvent.input(textarea, { target: { value: 'New content' } });

		// Disabled textareas don't fire input events
		expect(onChange).not.toHaveBeenCalled();
	});

	it('should show disabled visual state', () => {
		const { container } = render(MarkdownEditor, {
			props: {
				value: '',
				disabled: true
			}
		});

		const textarea = screen.getByRole('textbox');
		expect(textarea).toHaveAttribute('disabled');
	});
});

describe('MarkdownEditor Component - Readonly State', () => {
	it('should make textarea readonly when readonly prop is true', () => {
		render(MarkdownEditor, {
			props: {
				value: 'Content',
				readonly: true
			}
		});

		const textarea = screen.getByRole('textbox');
		expect(textarea).toHaveAttribute('readonly');
	});

	it('should allow editing when readonly is false', () => {
		render(MarkdownEditor, {
			props: {
				value: '',
				readonly: false
			}
		});

		const textarea = screen.getByRole('textbox');
		expect(textarea).not.toHaveAttribute('readonly');
	});

	it('should not call onchange when readonly', async () => {
		const onChange = vi.fn();

		render(MarkdownEditor, {
			props: {
				value: '',
				readonly: true,
				onchange: onChange
			}
		});

		const textarea = screen.getByRole('textbox');
		await fireEvent.input(textarea, { target: { value: 'New content' } });

		// Readonly textareas don't fire input events
		expect(onChange).not.toHaveBeenCalled();
	});
});

describe('MarkdownEditor Component - Error Display', () => {
	it('should display error message when error prop is set', () => {
		render(MarkdownEditor, {
			props: {
				value: '',
				error: 'This field is required'
			}
		});

		expect(screen.getByText('This field is required')).toBeInTheDocument();
	});

	it('should not display error when error prop is not set', () => {
		const { container } = render(MarkdownEditor, {
			props: { value: '' }
		});

		const errorText = container.querySelector('[class*="error"]');
		expect(errorText).not.toBeInTheDocument();
	});

	it('should clear error message when error prop changes to null', async () => {
		const { rerender } = render(MarkdownEditor, {
			props: {
				value: '',
				error: 'Error message'
			}
		});

		expect(screen.getByText('Error message')).toBeInTheDocument();

		await rerender({
			value: '',
			error: undefined
		});

		expect(screen.queryByText('Error message')).not.toBeInTheDocument();
	});

	it('should style editor with error state when error is present', () => {
		const { container } = render(MarkdownEditor, {
			props: {
				value: '',
				error: 'Error'
			}
		});

		const textarea = screen.getByRole('textbox');
		expect(textarea).toHaveClass(/error|invalid|danger/);
	});
});

describe('MarkdownEditor Component - Height Customization', () => {
	it('should apply default minHeight', () => {
		const { container } = render(MarkdownEditor, {
			props: { value: '' }
		});

		const textarea = screen.getByRole('textbox');
		const styles = window.getComputedStyle(textarea);

		// Should have minimum height set (default: 150px)
		expect(textarea).toBeInTheDocument();
	});

	it('should apply custom minHeight', () => {
		render(MarkdownEditor, {
			props: {
				value: '',
				minHeight: '200px'
			}
		});

		const textarea = screen.getByRole('textbox');
		expect(textarea.style.minHeight).toBe('200px');
	});

	it('should apply custom maxHeight', () => {
		render(MarkdownEditor, {
			props: {
				value: '',
				maxHeight: '500px'
			}
		});

		const textarea = screen.getByRole('textbox');
		expect(textarea.style.maxHeight).toBe('500px');
	});

	it('should apply both minHeight and maxHeight', () => {
		render(MarkdownEditor, {
			props: {
				value: '',
				minHeight: '100px',
				maxHeight: '300px'
			}
		});

		const textarea = screen.getByRole('textbox');
		expect(textarea.style.minHeight).toBe('100px');
		expect(textarea.style.maxHeight).toBe('300px');
	});
});

describe('MarkdownEditor Component - Custom Classes', () => {
	it('should accept custom CSS classes via class prop', () => {
		const { container } = render(MarkdownEditor, {
			props: {
				value: '',
				class: 'custom-editor'
			}
		});

		const wrapper = container.querySelector('.custom-editor');
		expect(wrapper).toBeInTheDocument();
	});

	it('should merge custom classes with default classes', () => {
		const { container } = render(MarkdownEditor, {
			props: {
				value: '',
				class: 'extra-class'
			}
		});

		const wrapper = container.firstChild as HTMLElement;
		expect(wrapper).toHaveClass('extra-class');
	});

	it('should render without custom classes when not provided', () => {
		const { container } = render(MarkdownEditor, {
			props: { value: '' }
		});

		expect(container.firstChild).toBeInTheDocument();
	});
});

describe('MarkdownEditor Component - Keyboard Interactions', () => {
	it('should allow typing in textarea', async () => {
		render(MarkdownEditor, {
			props: { value: '' }
		});

		const textarea = screen.getByRole('textbox');

		await fireEvent.input(textarea, { target: { value: 'Typed content' } });

		expect(textarea).toHaveValue('Typed content');
	});

	it('should handle tab key for indentation', async () => {
		const onChange = vi.fn();

		render(MarkdownEditor, {
			props: {
				value: '',
				onchange: onChange
			}
		});

		const textarea = screen.getByRole('textbox');

		// Press Tab key
		await fireEvent.keyDown(textarea, { key: 'Tab', code: 'Tab' });

		// Should insert tab or spaces
		expect(onChange).toHaveBeenCalled();
	});

	it('should support keyboard shortcuts for bold (Ctrl+B)', async () => {
		const onChange = vi.fn();

		render(MarkdownEditor, {
			props: {
				value: '',
				onchange: onChange
			}
		});

		const textarea = screen.getByRole('textbox');

		await fireEvent.keyDown(textarea, { key: 'b', ctrlKey: true });

		// Should insert bold syntax
		expect(onChange).toHaveBeenCalledWith(expect.stringContaining('**'));
	});

	it('should support keyboard shortcuts for italic (Ctrl+I)', async () => {
		const onChange = vi.fn();

		render(MarkdownEditor, {
			props: {
				value: '',
				onchange: onChange
			}
		});

		const textarea = screen.getByRole('textbox');

		await fireEvent.keyDown(textarea, { key: 'i', ctrlKey: true });

		// Should insert italic syntax
		expect(onChange).toHaveBeenCalledWith(expect.stringContaining('*'));
	});
});

describe('MarkdownEditor Component - Accessibility', () => {
	it('should have accessible textarea with role', () => {
		render(MarkdownEditor, {
			props: { value: '' }
		});

		const textarea = screen.getByRole('textbox');
		expect(textarea).toBeInTheDocument();
	});

	it('should support aria-label for screen readers', () => {
		render(MarkdownEditor, {
			props: { value: '' }
		});

		const textarea = screen.getByRole('textbox');
		expect(textarea).toHaveAttribute('aria-label');
	});

	it('should associate error message with textarea using aria-describedby', () => {
		render(MarkdownEditor, {
			props: {
				value: '',
				error: 'Error message'
			}
		});

		const textarea = screen.getByRole('textbox');
		expect(textarea).toHaveAttribute('aria-describedby');
		expect(textarea).toHaveAttribute('aria-invalid', 'true');
	});

	it('should be keyboard navigable', () => {
		render(MarkdownEditor, {
			props: { value: '' }
		});

		const textarea = screen.getByRole('textbox');
		textarea.focus();

		expect(document.activeElement).toBe(textarea);
	});

	it('should have proper ARIA labels on toolbar buttons', () => {
		render(MarkdownEditor, {
			props: { value: '' }
		});

		const boldButton = screen.getByRole('button', { name: /bold/i });
		expect(boldButton).toHaveAttribute('aria-label');
	});
});

describe('MarkdownEditor Component - Real-world Use Cases', () => {
	it('should handle typical character description editing', async () => {
		const onChange = vi.fn();

		render(MarkdownEditor, {
			props: {
				value: '',
				mode: 'split',
				onchange: onChange
			}
		});

		const textarea = screen.getByRole('textbox');

		const characterDesc = '# Eldrin\n\n**Class:** Rogue\n*Level:* 5';
		await fireEvent.input(textarea, { target: { value: characterDesc } });

		expect(onChange).toHaveBeenCalledWith(characterDesc);

		// Preview should show formatted content
		expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Eldrin');
		expect(screen.getByText('Class:')).toBeInTheDocument();
	});

	it('should handle markdown with lists and links', async () => {
		const content = `## Equipment\n- Sword\n- Shield\n\n[Wiki](https://example.com)`;

		render(MarkdownEditor, {
			props: {
				value: content,
				mode: 'split'
			}
		});

		expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Equipment');
		expect(screen.getByText('Sword')).toBeInTheDocument();
		expect(screen.getByRole('link', { name: 'Wiki' })).toBeInTheDocument();
	});

	it('should handle code blocks in notes', async () => {
		const content = '```javascript\nconst spell = "Fireball";\n```';

		render(MarkdownEditor, {
			props: {
				value: content,
				mode: 'split'
			}
		});

		expect(screen.getByText(/const spell/)).toBeInTheDocument();
	});
});

describe('MarkdownEditor Component - Edge Cases', () => {
	it('should handle very long content', async () => {
		const longContent = 'Word '.repeat(1000);

		render(MarkdownEditor, {
			props: { value: longContent }
		});

		const textarea = screen.getByRole('textbox');
		expect(textarea).toHaveValue(longContent);
	});

	it('should handle special characters', async () => {
		const specialContent = '© ™ € £ ¥ <>&"';

		render(MarkdownEditor, {
			props: { value: specialContent }
		});

		const textarea = screen.getByRole('textbox');
		expect(textarea).toHaveValue(specialContent);
	});

	it('should handle null value gracefully', () => {
		const { container } = render(MarkdownEditor, {
			props: { value: null as any }
		});

		expect(container).toBeInTheDocument();
	});

	it('should handle undefined value gracefully', () => {
		const { container } = render(MarkdownEditor, {
			props: { value: undefined as any }
		});

		expect(container).toBeInTheDocument();
	});

	it('should handle rapid mode switching', async () => {
		const { rerender } = render(MarkdownEditor, {
			props: {
				value: '# Test',
				mode: 'edit'
			}
		});

		await rerender({ value: '# Test', mode: 'preview' });
		await rerender({ value: '# Test', mode: 'split' });
		await rerender({ value: '# Test', mode: 'edit' });

		expect(screen.getByRole('textbox')).toBeInTheDocument();
	});

	it('should preserve cursor position after toolbar formatting', async () => {
		const onChange = vi.fn();

		render(MarkdownEditor, {
			props: {
				value: 'Some text here',
				onchange: onChange
			}
		});

		const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;

		// Set cursor in middle of text
		textarea.setSelectionRange(5, 9);

		const boldButton = screen.getByRole('button', { name: /bold/i });
		await fireEvent.click(boldButton);

		// Should wrap selected text
		expect(onChange).toHaveBeenCalledWith('Some **text** here');
	});
});
