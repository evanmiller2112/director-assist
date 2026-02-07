<!--
  @component FieldSuggestionBadge

  A small inline badge that appears next to field labels when AI suggestions
  are available. Clicking the badge triggers display of the suggestion popover.

  @prop {string} fieldName - The name of the field this badge is for
  @prop {boolean} hasSuggestion - Whether a suggestion is available (controls visibility)
  @prop {Function} [onClick] - Callback when badge is clicked

  @example
  ```svelte
  <FieldSuggestionBadge
    fieldName="description"
    hasSuggestion={true}
    onClick={() => showPopover()}
  />
  ```
-->
<script lang="ts">
	import { Lightbulb } from 'lucide-svelte';

	interface Props {
		fieldName: string;
		hasSuggestion: boolean;
		onClick?: () => void;
	}

	let { fieldName, hasSuggestion, onClick }: Props = $props();

	function handleClick() {
		if (onClick) {
			onClick();
		}
	}

	function handleKeyDown(event: KeyboardEvent) {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			handleClick();
		}
	}
</script>

{#if hasSuggestion}
	<button
		type="button"
		onclick={handleClick}
		onkeydown={handleKeyDown}
		aria-label="AI suggestion available for {fieldName}"
		class="inline-flex items-center gap-1 rounded-md bg-amber-100 dark:bg-amber-900/30 px-1.5 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-900/50 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-1 transition-colors cursor-pointer"
	>
		<Lightbulb class="h-3 w-3" />
		<span class="hidden sm:inline">AI</span>
	</button>
{/if}
