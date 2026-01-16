<!--
  @component FieldGenerateButton

  A button component for triggering AI content generation for entity fields.
  Displays a sparkle icon in normal state and a spinner when loading.

  @prop {boolean} [disabled=false] - Whether the button is disabled
  @prop {boolean} [loading=false] - Whether generation is in progress (shows spinner)
  @prop {Function} onGenerate - Callback function to invoke when button is clicked

  @example
  ```svelte
  <FieldGenerateButton
    disabled={!hasApiKey}
    loading={isGenerating}
    onGenerate={handleGenerate}
  />
  ```
-->
<script lang="ts">
	import { Sparkles, Loader2 } from 'lucide-svelte';

	interface Props {
		disabled?: boolean;
		loading?: boolean;
		onGenerate: () => void;
	}

	let { disabled = false, loading = false, onGenerate }: Props = $props();
</script>

<button
	type="button"
	onclick={onGenerate}
	disabled={disabled || loading}
	class="inline-flex items-center gap-1.5 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-2 py-1 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
	title="Generate content with AI"
>
	{#if loading}
		<Loader2 class="h-4 w-4 animate-spin" />
	{:else}
		<Sparkles class="h-4 w-4" />
	{/if}
	<span class="hidden sm:inline">Generate</span>
</button>
