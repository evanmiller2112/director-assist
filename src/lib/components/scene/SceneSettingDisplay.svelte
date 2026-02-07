<script lang="ts">
/**
 * SceneSettingDisplay Component
 *
 * Displays scene setting (read-aloud text) in a visually distinct styled box
 * with italic text and distinct background.
 */

import MarkdownViewer from '$lib/components/markdown/MarkdownViewer.svelte';

interface Props {
	setting?: string;
}

let { setting }: Props = $props();

const isEmpty = $derived(!setting || setting.trim() === '');
</script>

<div
	class="scene-setting-container bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4"
	data-testid="scene-setting-container"
	role="region"
	aria-label="Scene setting (read-aloud text)"
>
	{#if isEmpty}
		<p class="text-gray-500 dark:text-gray-400 italic" data-testid="scene-setting-text">
			No setting defined
		</p>
	{:else}
		<div class="italic text-slate-700 dark:text-slate-300" data-testid="scene-setting-text">
			<MarkdownViewer content={setting || ''} class="scene-setting-markdown" />
		</div>
	{/if}
</div>

<style>
	/* Override markdown styles for read-aloud formatting */
	.scene-setting-container :global(.scene-setting-markdown p) {
		@apply italic;
	}
</style>
