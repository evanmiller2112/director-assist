<script lang="ts">
	/**
	 * MarkdownEditor Component
	 *
	 * Issue #13: Add Markdown Editor for Rich Text Fields
	 *
	 * Provides a rich text editor with markdown support,
	 * including a toolbar for formatting, live preview, and multiple editing modes.
	 */

	import { Bold, Italic, Heading, Code, Link, List } from 'lucide-svelte';
	import MarkdownViewer from './MarkdownViewer.svelte';

	// Props
	interface Props {
		value: string;
		placeholder?: string;
		disabled?: boolean;
		readonly?: boolean;
		mode?: 'edit' | 'preview' | 'split';
		minHeight?: string;
		maxHeight?: string;
		class?: string;
		showToolbar?: boolean;
		error?: string;
		onchange?: (value: string) => void;
	}

	let {
		value = $bindable(''),
		placeholder = '',
		disabled = false,
		readonly = false,
		mode = 'split',
		minHeight = '150px',
		maxHeight = '400px',
		class: className = '',
		showToolbar = true,
		error = '',
		onchange
	}: Props = $props();

	let textareaRef: HTMLTextAreaElement;

	// Handle input changes
	function handleInput(event: Event) {
		// Don't process input if disabled or readonly
		if (disabled || readonly) return;

		const target = event.target as HTMLTextAreaElement;
		value = target.value;
		onchange?.(value);
	}

	// Toolbar formatting functions
	function wrapSelection(before: string, after: string = before) {
		if (!textareaRef || disabled || readonly) return;

		const start = textareaRef.selectionStart;
		const end = textareaRef.selectionEnd;
		const selectedText = value.substring(start, end);
		const newText = value.substring(0, start) + before + selectedText + after + value.substring(end);

		value = newText;
		onchange?.(value);

		// Restore selection after a tick
		setTimeout(() => {
			if (!textareaRef) return;
			textareaRef.focus();
			textareaRef.setSelectionRange(
				start + before.length,
				end + before.length
			);
		}, 0);
	}

	function insertAtCursor(text: string) {
		if (!textareaRef || disabled || readonly) return;

		const start = textareaRef.selectionStart;
		const newText = value.substring(0, start) + text + value.substring(start);

		value = newText;
		onchange?.(value);

		// Move cursor after inserted text
		setTimeout(() => {
			if (!textareaRef) return;
			textareaRef.focus();
			textareaRef.setSelectionRange(start + text.length, start + text.length);
		}, 0);
	}

	function insertAtLineStart(prefix: string) {
		if (!textareaRef || disabled || readonly) return;

		const start = textareaRef.selectionStart;
		const end = textareaRef.selectionEnd;

		// Find the start of the current line
		const lineStart = value.lastIndexOf('\n', start - 1) + 1;
		const lineEnd = value.indexOf('\n', end);
		const actualLineEnd = lineEnd === -1 ? value.length : lineEnd;

		const line = value.substring(lineStart, actualLineEnd);
		const newLine = prefix + line;
		const newText = value.substring(0, lineStart) + newLine + value.substring(actualLineEnd);

		value = newText;
		onchange?.(value);

		// Restore cursor position
		setTimeout(() => {
			if (!textareaRef) return;
			textareaRef.focus();
		}, 0);
	}

	// Toolbar button handlers
	function makeBold() {
		wrapSelection('**');
	}

	function makeItalic() {
		wrapSelection('*');
	}

	function makeHeading() {
		insertAtLineStart('# ');
	}

	function makeCode() {
		const start = textareaRef.selectionStart;
		const end = textareaRef.selectionEnd;
		const selectedText = value.substring(start, end);

		if (selectedText.includes('\n')) {
			// Multi-line: use code block
			wrapSelection('```\n', '\n```');
		} else {
			// Single line: use inline code
			wrapSelection('`');
		}
	}

	function insertLink() {
		if (!textareaRef || disabled || readonly) return;

		const start = textareaRef.selectionStart;
		const end = textareaRef.selectionEnd;
		const selectedText = value.substring(start, end);

		if (selectedText) {
			const newText = value.substring(0, start) + `[${selectedText}](url)` + value.substring(end);
			value = newText;
			onchange?.(value);

			// Select "url" part for easy replacement
			setTimeout(() => {
				if (!textareaRef) return;
				textareaRef.focus();
				const urlStart = start + selectedText.length + 3; // after "]("
				textareaRef.setSelectionRange(urlStart, urlStart + 3);
			}, 0);
		} else {
			insertAtCursor('[text](url)');
		}
	}

	function makeList() {
		insertAtLineStart('- ');
	}

	// Keyboard shortcuts
	function handleKeyDown(event: KeyboardEvent) {
		if (event.ctrlKey || event.metaKey) {
			switch (event.key.toLowerCase()) {
				case 'b':
					event.preventDefault();
					makeBold();
					break;
				case 'i':
					event.preventDefault();
					makeItalic();
					break;
				case 'tab':
					// Allow tab for indentation
					event.preventDefault();
					insertAtCursor('\t');
					break;
			}
		} else if (event.key === 'Tab') {
			event.preventDefault();
			insertAtCursor('\t');
		}
	}

	// Determine if we should show the textarea
	const showTextarea = $derived(mode === 'edit' || mode === 'split');
	const showPreview = $derived(mode === 'preview' || mode === 'split');

	// Error ID for aria-describedby
	const errorId = `error-${Math.random().toString(36).substring(2, 9)}`;
</script>

<div class="markdown-editor {className}">
	{#if showToolbar && showTextarea}
		<div
			class="toolbar flex gap-1 p-2 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-t"
			role="toolbar"
			aria-label="Markdown formatting toolbar"
		>
			<button
				type="button"
				class="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded disabled:opacity-50 disabled:cursor-not-allowed"
				onclick={makeBold}
				disabled={disabled || readonly}
				aria-label="Bold"
				title="Bold (Ctrl+B)"
			>
				<Bold size={18} />
			</button>
			<button
				type="button"
				class="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded disabled:opacity-50 disabled:cursor-not-allowed"
				onclick={makeItalic}
				disabled={disabled || readonly}
				aria-label="Italic"
				title="Italic (Ctrl+I)"
			>
				<Italic size={18} />
			</button>
			<button
				type="button"
				class="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded disabled:opacity-50 disabled:cursor-not-allowed"
				onclick={makeHeading}
				disabled={disabled || readonly}
				aria-label="Heading"
				title="Heading"
			>
				<Heading size={18} />
			</button>
			<button
				type="button"
				class="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded disabled:opacity-50 disabled:cursor-not-allowed"
				onclick={makeCode}
				disabled={disabled || readonly}
				aria-label="Code"
				title="Code"
			>
				<Code size={18} />
			</button>
			<button
				type="button"
				class="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded disabled:opacity-50 disabled:cursor-not-allowed"
				onclick={insertLink}
				disabled={disabled || readonly}
				aria-label="Link"
				title="Link"
			>
				<Link size={18} />
			</button>
			<button
				type="button"
				class="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded disabled:opacity-50 disabled:cursor-not-allowed"
				onclick={makeList}
				disabled={disabled || readonly}
				aria-label="List"
				title="List"
			>
				<List size={18} />
			</button>
		</div>
	{/if}

	<div class="editor-content" class:split={mode === 'split'}>
		{#if showTextarea}
			<textarea
				bind:this={textareaRef}
				{value}
				{placeholder}
				{disabled}
				readonly={readonly}
				oninput={handleInput}
				onkeydown={handleKeyDown}
				class="editor-textarea w-full p-3 font-mono text-sm border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 resize-vertical"
				class:rounded-b={showToolbar && !showPreview}
				class:rounded={!showToolbar && !showPreview}
				class:rounded-bl={showToolbar && showPreview}
				class:error={error}
				class:border-red-500={error}
				class:dark:border-red-400={error}
				style:min-height={minHeight}
				style:max-height={maxHeight}
				aria-label="Markdown editor"
				aria-invalid={error ? 'true' : 'false'}
				aria-describedby={error ? errorId : undefined}
			></textarea>
		{/if}

		{#if showPreview}
			<div
				class="preview-pane p-3 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 overflow-auto"
				class:rounded-br={showToolbar && showTextarea}
				class:rounded-b={showToolbar && !showTextarea}
				class:rounded={!showToolbar}
				style:min-height={minHeight}
				style:max-height={maxHeight}
			>
				<MarkdownViewer content={value || ''} />
			</div>
		{/if}
	</div>

	{#if error}
		<div id={errorId} class="error-message text-red-600 dark:text-red-400 text-sm mt-1">
			{error}
		</div>
	{/if}
</div>

<style>
	.editor-content.split {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0;
	}

	.editor-content.split .editor-textarea {
		border-right: none;
		border-radius: 0 0 0 0.375rem;
	}

	.editor-content.split .preview-pane {
		border-radius: 0 0 0.375rem 0;
	}

	.editor-content.split .editor-textarea:first-child:not(:only-child) {
		border-top-left-radius: 0;
	}

	.editor-content.split .preview-pane:last-child {
		border-top-right-radius: 0;
	}

	.editor-textarea {
		font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
		line-height: 1.5;
	}

	.preview-pane {
		line-height: 1.5;
	}
</style>
