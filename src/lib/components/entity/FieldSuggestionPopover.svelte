<!--
  @component FieldSuggestionPopover

  Displays a popover with full AI suggestion content and action buttons.
  Allows users to accept (copy content), dismiss (mark as dismissed), or close (no action).

  @prop {FieldSuggestion} suggestion - The suggestion to display
  @prop {Function} [onAccept] - Callback when user accepts the suggestion, receives suggestedContent
  @prop {Function} [onDismiss] - Callback when user dismisses the suggestion
  @prop {Function} [onClose] - Callback when user closes without action

  @example
  ```svelte
  <FieldSuggestionPopover
    suggestion={fieldSuggestion}
    onAccept={(content) => applyToField(content)}
    onDismiss={() => markDismissed()}
    onClose={() => closePopover()}
  />
  ```
-->
<script lang="ts">
	import { Check, X } from 'lucide-svelte';
	import { onMount } from 'svelte';

	interface FieldSuggestion {
		id?: number;
		entityType: string;
		entityId?: number;
		fieldName: string;
		suggestedContent: string;
		createdAt: Date;
		dismissed?: boolean;
	}

	interface Props {
		suggestion: FieldSuggestion;
		onAccept?: (content: string) => void;
		onDismiss?: () => void;
		onClose?: () => void;
	}

	let { suggestion, onAccept, onDismiss, onClose }: Props = $props();

	function handleAccept() {
		if (onAccept) {
			onAccept(suggestion.suggestedContent);
		}
	}

	function handleDismiss() {
		if (onDismiss) {
			onDismiss();
		}
	}

	function handleClose() {
		if (onClose) {
			onClose();
		}
	}

	function handleEscape(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			handleClose();
		}
	}

	onMount(() => {
		document.addEventListener('keydown', handleEscape);
		return () => {
			document.removeEventListener('keydown', handleEscape);
		};
	});
</script>

<div
	role="dialog"
	aria-label="AI suggestion for {suggestion.fieldName}"
	class="absolute z-50 mt-2 w-80 max-w-md rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 shadow-lg"
>
	<!-- Close button (top-right corner) -->
	<button
		type="button"
		onclick={handleClose}
		aria-label="Close suggestion popover"
		class="absolute top-2 right-2 rounded-md p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
	>
		<X class="h-4 w-4" />
	</button>

	<!-- Suggestion Content -->
	<div class="pr-6 mb-4">
		<p class="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap break-words">
			{suggestion.suggestedContent}
		</p>
	</div>

	<!-- Action Buttons -->
	<div class="flex items-center gap-2">
		<!-- Accept Button -->
		<button
			type="button"
			onclick={handleAccept}
			aria-label="Accept suggestion"
			class="inline-flex items-center gap-1.5 rounded-md bg-blue-600 hover:bg-blue-700 px-3 py-1.5 text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
		>
			<Check class="h-4 w-4" />
			<span>Accept</span>
		</button>

		<!-- Dismiss Button -->
		<button
			type="button"
			onclick={handleDismiss}
			aria-label="Dismiss suggestion"
			class="inline-flex items-center gap-1.5 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
		>
			<X class="h-4 w-4" />
			<span>Dismiss</span>
		</button>
	</div>
</div>
