/**
 * Tests for MarkdownEditor Component - Reactivity Issues
 *
 * Issue #327: Fix Svelte 5 reactivity warnings
 *
 * This test file verifies that the MarkdownEditor component properly reacts to prop changes.
 * The component has the following reactivity issues:
 * - Lines 45, 48: `mode` prop captured at initial value in `$state()`
 * - Line 43: `textareaRef` needs `$state()` declaration
 *
 * These tests are written in the RED phase of TDD - they will FAIL until the
 * reactivity issues are fixed by senior-web-architect.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import MarkdownEditor from './MarkdownEditor.svelte';

describe('MarkdownEditor - Reactivity: Mode Prop Changes', () => {
	it('should initially render in edit mode when mode prop is "edit"', () => {
		render(MarkdownEditor, {
			props: {
				value: 'Initial content',
				mode: 'edit'
			}
		});

		const textarea = screen.getByLabelText(/markdown editor/i);
		expect(textarea).toBeInTheDocument();
		expect(textarea).toBeVisible();
	});

	it('should initially render in preview mode when mode prop is "preview"', () => {
		render(MarkdownEditor, {
			props: {
				value: 'Preview content',
				mode: 'preview'
			}
		});

		// Should not show textarea in preview mode
		const textarea = screen.queryByLabelText(/markdown editor/i);
		expect(textarea).not.toBeInTheDocument();

		// Should show preview content
		expect(screen.getByText('Preview content')).toBeInTheDocument();
	});

	it('should update to preview mode when mode prop changes from edit to preview', async () => {
		const { rerender } = render(MarkdownEditor, {
			props: {
				value: 'Test content',
				mode: 'edit' as 'edit' | 'preview' | 'split'
			}
		});

		// Initially in edit mode - textarea should be visible
		const textarea = screen.getByLabelText(/markdown editor/i);
		expect(textarea).toBeVisible();

		// Change mode to preview
		await rerender({
			value: 'Test content',
			mode: 'preview' as 'edit' | 'preview' | 'split'
		});

		// Textarea should no longer be in the document
		expect(screen.queryByLabelText(/markdown editor/i)).not.toBeInTheDocument();

		// Preview should show the content
		expect(screen.getByText('Test content')).toBeInTheDocument();
	});

	it('should update to edit mode when mode prop changes from preview to edit', async () => {
		const { rerender } = render(MarkdownEditor, {
			props: {
				value: 'Test content',
				mode: 'preview' as 'edit' | 'preview' | 'split'
			}
		});

		// Initially in preview mode
		expect(screen.queryByLabelText(/markdown editor/i)).not.toBeInTheDocument();
		expect(screen.getByText('Test content')).toBeInTheDocument();

		// Change mode to edit
		await rerender({
			value: 'Test content',
			mode: 'edit' as 'edit' | 'preview' | 'split'
		});

		// Textarea should now be visible
		const textarea = screen.getByLabelText(/markdown editor/i);
		expect(textarea).toBeVisible();
		expect(textarea).toHaveValue('Test content');
	});

	it('should switch to split mode when mode prop changes to split', async () => {
		const { rerender } = render(MarkdownEditor, {
			props: {
				value: 'Split mode content',
				mode: 'edit' as 'edit' | 'preview' | 'split'
			}
		});

		// Change to split mode
		await rerender({
			value: 'Split mode content',
			mode: 'split' as 'edit' | 'preview' | 'split'
		});

		// Both textarea and preview should be visible in split mode
		const textarea = screen.getByLabelText(/markdown editor/i);
		expect(textarea).toBeVisible();
		expect(screen.getByText('Split mode content')).toBeInTheDocument();
	});

	it('should handle rapid mode changes', async () => {
		const { rerender } = render(MarkdownEditor, {
			props: {
				value: 'Rapid changes',
				mode: 'edit' as 'edit' | 'preview' | 'split'
			}
		});

		// Change to preview
		await rerender({
			value: 'Rapid changes',
			mode: 'preview' as 'edit' | 'preview' | 'split'
		});

		// Change to split
		await rerender({
			value: 'Rapid changes',
			mode: 'split' as 'edit' | 'preview' | 'split'
		});

		// Change back to edit
		await rerender({
			value: 'Rapid changes',
			mode: 'edit' as 'edit' | 'preview' | 'split'
		});

		// Should end up in edit mode
		const textarea = screen.getByLabelText(/markdown editor/i);
		expect(textarea).toBeVisible();
	});

	it('should disable toolbar buttons in preview mode when mode changes', async () => {
		const { rerender } = render(MarkdownEditor, {
			props: {
				value: 'Test',
				mode: 'edit' as 'edit' | 'preview' | 'split',
				showToolbar: true
			}
		});

		// Initially in edit mode - toolbar buttons should be enabled
		const boldButton = screen.getByLabelText(/bold/i);
		expect(boldButton).not.toBeDisabled();

		// Change to preview mode
		await rerender({
			value: 'Test',
			mode: 'preview' as 'edit' | 'preview' | 'split',
			showToolbar: true
		});

		// Toolbar buttons should be disabled in preview mode
		expect(boldButton).toBeDisabled();
	});

	it('should maintain user edits when mode changes', async () => {
		const mockOnChange = vi.fn();
		const { rerender } = render(MarkdownEditor, {
			props: {
				value: 'Original',
				mode: 'edit' as 'edit' | 'preview' | 'split',
				onchange: mockOnChange
			}
		});

		// Edit the content
		const textarea = screen.getByLabelText(/markdown editor/i) as HTMLTextAreaElement;
		await fireEvent.input(textarea, { target: { value: 'Modified content' } });

		// Change to preview mode
		await rerender({
			value: 'Modified content',
			mode: 'preview' as 'edit' | 'preview' | 'split',
			onchange: mockOnChange
		});

		// Preview should show the modified content
		expect(screen.getByText('Modified content')).toBeInTheDocument();

		// Change back to edit
		await rerender({
			value: 'Modified content',
			mode: 'edit' as 'edit' | 'preview' | 'split',
			onchange: mockOnChange
		});

		// Textarea should still have the modified content
		const updatedTextarea = screen.getByLabelText(/markdown editor/i) as HTMLTextAreaElement;
		expect(updatedTextarea).toHaveValue('Modified content');
	});
});

describe('MarkdownEditor - Reactivity: Preview Toggle Button', () => {
	it('should toggle preview when mode changes affect the toggle button state', async () => {
		const { rerender } = render(MarkdownEditor, {
			props: {
				value: 'Test',
				mode: 'edit' as 'edit' | 'preview' | 'split',
				showToolbar: true
			}
		});

		// Toggle button should show eye icon (for preview) in edit mode
		const toggleButton = screen.getByTestId('preview-toggle');
		expect(toggleButton).toHaveAttribute('aria-label', 'Preview');

		// Change to preview mode
		await rerender({
			value: 'Test',
			mode: 'preview' as 'edit' | 'preview' | 'split',
			showToolbar: true
		});

		// Toggle button should now show pencil icon (for edit)
		expect(toggleButton).toHaveAttribute('aria-label', 'Edit');
	});

	it('should reflect external mode changes in internal toggle state', async () => {
		const { rerender } = render(MarkdownEditor, {
			props: {
				value: 'Content',
				mode: 'edit' as 'edit' | 'preview' | 'split',
				showToolbar: true
			}
		});

		const toggleButton = screen.getByTestId('preview-toggle');

		// External change to preview
		await rerender({
			value: 'Content',
			mode: 'preview' as 'edit' | 'preview' | 'split',
			showToolbar: true
		});

		expect(toggleButton).toHaveAttribute('aria-label', 'Edit');

		// External change back to edit
		await rerender({
			value: 'Content',
			mode: 'edit' as 'edit' | 'preview' | 'split',
			showToolbar: true
		});

		expect(toggleButton).toHaveAttribute('aria-label', 'Preview');
	});
});

describe('MarkdownEditor - Reactivity: TextareaRef State', () => {
	it('should maintain textarea reference when mode switches from edit to split', async () => {
		const { rerender } = render(MarkdownEditor, {
			props: {
				value: 'Test content',
				mode: 'edit' as 'edit' | 'preview' | 'split',
				showToolbar: true
			}
		});

		// Click bold button in edit mode
		const boldButton = screen.getByLabelText(/bold/i);
		await fireEvent.click(boldButton);

		// Change to split mode
		await rerender({
			value: '**Test content**',
			mode: 'split' as 'edit' | 'preview' | 'split',
			showToolbar: true
		});

		// Textarea should still be accessible and functional
		const textarea = screen.getByLabelText(/markdown editor/i) as HTMLTextAreaElement;
		expect(textarea).toBeVisible();

		// Should be able to click italic button and modify content
		const italicButton = screen.getByLabelText(/italic/i);
		await fireEvent.click(italicButton);

		// This tests that textareaRef is properly maintained across renders
		expect(textarea).toBeInTheDocument();
	});

	it('should allow toolbar operations after mode changes', async () => {
		const { rerender } = render(MarkdownEditor, {
			props: {
				value: 'Hello',
				mode: 'preview' as 'edit' | 'preview' | 'split',
				showToolbar: true
			}
		});

		// Change to edit mode
		await rerender({
			value: 'Hello',
			mode: 'edit' as 'edit' | 'preview' | 'split',
			showToolbar: true
		});

		// Should be able to use toolbar functions
		const boldButton = screen.getByLabelText(/bold/i);
		expect(boldButton).not.toBeDisabled();

		// The textareaRef should be properly set for toolbar operations
		await fireEvent.click(boldButton);

		const textarea = screen.getByLabelText(/markdown editor/i) as HTMLTextAreaElement;
		expect(textarea).toBeInTheDocument();
	});
});

describe('MarkdownEditor - Reactivity: Edge Cases', () => {
	it('should handle mode prop changing while user is typing', async () => {
		const mockOnChange = vi.fn();
		const { rerender } = render(MarkdownEditor, {
			props: {
				value: 'Original text',
				mode: 'edit' as 'edit' | 'preview' | 'split',
				onchange: mockOnChange
			}
		});

		// User starts typing
		const textarea = screen.getByLabelText(/markdown editor/i) as HTMLTextAreaElement;
		await fireEvent.input(textarea, { target: { value: 'Modified' } });

		// Mode changes externally
		await rerender({
			value: 'Modified',
			mode: 'split' as 'edit' | 'preview' | 'split',
			onchange: mockOnChange
		});

		// Content should be preserved
		const updatedTextarea = screen.getByLabelText(/markdown editor/i) as HTMLTextAreaElement;
		expect(updatedTextarea).toHaveValue('Modified');
	});

	it('should handle undefined mode prop gracefully', async () => {
		const { rerender } = render(MarkdownEditor, {
			props: {
				value: 'Test'
				// mode is undefined, should default to 'edit'
			}
		});

		// Should default to edit mode
		expect(screen.getByLabelText(/markdown editor/i)).toBeVisible();

		// Change mode to preview
		await rerender({
			value: 'Test',
			mode: 'preview' as 'edit' | 'preview' | 'split'
		});

		// Should switch to preview
		expect(screen.queryByLabelText(/markdown editor/i)).not.toBeInTheDocument();
	});

	it('should handle multiple sequential mode changes without errors', async () => {
		const { rerender } = render(MarkdownEditor, {
			props: {
				value: 'Test',
				mode: 'edit' as 'edit' | 'preview' | 'split'
			}
		});

		// Perform multiple mode changes
		const modes: Array<'edit' | 'preview' | 'split'> = ['preview', 'edit', 'split', 'edit', 'preview'];

		for (const mode of modes) {
			await rerender({
				value: 'Test',
				mode
			});
		}

		// Should end in preview mode without errors
		expect(screen.queryByLabelText(/markdown editor/i)).not.toBeInTheDocument();
		expect(screen.getByText('Test')).toBeInTheDocument();
	});
});

describe('MarkdownEditor - Reactivity: Integration with Other Props', () => {
	it('should react to mode changes while other props also change', async () => {
		const { rerender } = render(MarkdownEditor, {
			props: {
				value: 'Original',
				mode: 'edit' as 'edit' | 'preview' | 'split',
				placeholder: 'Type here',
				disabled: false
			}
		});

		// Change multiple props at once
		await rerender({
			value: 'Updated',
			mode: 'preview' as 'edit' | 'preview' | 'split',
			placeholder: 'New placeholder',
			disabled: false
		});

		// Should reflect both value and mode changes
		expect(screen.queryByLabelText(/markdown editor/i)).not.toBeInTheDocument();
		expect(screen.getByText('Updated')).toBeInTheDocument();
	});

	it('should maintain reactivity when switching from readonly to editable', async () => {
		const { rerender } = render(MarkdownEditor, {
			props: {
				value: 'Content',
				mode: 'edit' as 'edit' | 'preview' | 'split',
				readonly: true
			}
		});

		// Change to preview mode while also removing readonly
		await rerender({
			value: 'Content',
			mode: 'preview' as 'edit' | 'preview' | 'split',
			readonly: false
		});

		expect(screen.getByText('Content')).toBeInTheDocument();

		// Change back to edit
		await rerender({
			value: 'Content',
			mode: 'edit' as 'edit' | 'preview' | 'split',
			readonly: false
		});

		const textarea = screen.getByLabelText(/markdown editor/i) as HTMLTextAreaElement;
		expect(textarea).not.toHaveAttribute('readonly');
	});
});
