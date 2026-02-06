<script lang="ts">
	/**
	 * MarkdownViewer Component
	 *
	 * Issue #13: Add Markdown Editor for Rich Text Fields
	 *
	 * Renders markdown content as HTML in a read-only view.
	 * Handles markdown parsing, HTML sanitization, and safe rendering.
	 */

	import { marked } from 'marked';
	import { sanitizeHtml } from '$lib/utils/markdownUtils';

	// Props
	interface Props {
		content: string;
		class?: string;
		sanitize?: boolean;
	}

	let { content = '', class: className = '', sanitize = true }: Props = $props();

	// Configure marked for better rendering
	marked.setOptions({
		gfm: true, // GitHub Flavored Markdown
		breaks: true // Convert \n to <br>
	});

	// Derive HTML from markdown content
	const html = $derived.by(() => {
		if (!content) return '';

		try {
			// Parse markdown to HTML
			const rawHtml = marked.parse(content) as string;

			// Sanitize if enabled
			if (sanitize) {
				return sanitizeHtml(rawHtml);
			}

			return rawHtml;
		} catch (error) {
			console.error('Error parsing markdown:', error);
			return '';
		}
	});

	// Post-process HTML to add target="_blank" to external links
	const processedHtml = $derived.by(() => {
		if (!html) return '';

		// Add target="_blank" and rel="noopener noreferrer" to external links
		return html.replace(
			/<a\s+href="(https?:\/\/[^"]+)"([^>]*)>/gi,
			'<a href="$1" target="_blank" rel="noopener noreferrer"$2>'
		);
	});
</script>

<div class="markdown-viewer prose prose-slate dark:prose-invert max-w-none {className}">
	{@html processedHtml}
</div>

<!-- svelte-ignore css_unused_selector -->
<style>
	/* Additional markdown-specific styles */
	.markdown-viewer :global(code) {
		@apply bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-sm;
	}

	.markdown-viewer :global(pre) {
		@apply bg-slate-100 dark:bg-slate-800 p-4 rounded overflow-x-auto;
	}

	.markdown-viewer :global(pre code) {
		@apply bg-transparent p-0;
	}

	.markdown-viewer :global(blockquote) {
		@apply border-l-4 border-slate-300 dark:border-slate-600 pl-4 italic;
	}

	.markdown-viewer :global(table) {
		@apply w-full border-collapse;
	}

	.markdown-viewer :global(th) {
		@apply border border-slate-300 dark:border-slate-600 px-4 py-2 bg-slate-100 dark:bg-slate-800;
	}

	.markdown-viewer :global(td) {
		@apply border border-slate-300 dark:border-slate-600 px-4 py-2;
	}

	.markdown-viewer :global(a) {
		@apply text-blue-600 dark:text-blue-400 hover:underline;
	}

	.markdown-viewer :global(hr) {
		@apply my-4 border-slate-300 dark:border-slate-600;
	}

	.markdown-viewer :global(img) {
		@apply max-w-full h-auto;
	}

	.markdown-viewer :global(ul),
	.markdown-viewer :global(ol) {
		@apply pl-6;
	}

	.markdown-viewer :global(ul) {
		@apply list-disc;
	}

	.markdown-viewer :global(ol) {
		@apply list-decimal;
	}

	.markdown-viewer :global(li) {
		@apply mb-1;
	}

	.markdown-viewer :global(h1),
	.markdown-viewer :global(h2),
	.markdown-viewer :global(h3),
	.markdown-viewer :global(h4),
	.markdown-viewer :global(h5),
	.markdown-viewer :global(h6) {
		@apply font-bold mt-6 mb-4;
	}

	.markdown-viewer :global(h1) {
		@apply text-3xl;
	}

	.markdown-viewer :global(h2) {
		@apply text-2xl;
	}

	.markdown-viewer :global(h3) {
		@apply text-xl;
	}

	.markdown-viewer :global(h4) {
		@apply text-lg;
	}

	.markdown-viewer :global(p) {
		@apply mb-4;
	}
</style>
