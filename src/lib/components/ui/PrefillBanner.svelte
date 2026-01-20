<script lang="ts">
	import { Info, X } from 'lucide-svelte';
	import { goto } from '$app/navigation';

	interface Props {
		sourceMessageId?: string;
		onDismiss?: () => void;
	}

	let { sourceMessageId, onDismiss }: Props = $props();

	function handleDismiss() {
		onDismiss?.();
	}

	function handleViewMessage(event: MouseEvent) {
		event.preventDefault();
		if (sourceMessageId) {
			goto(`/chat?message=${sourceMessageId}`);
		}
	}
</script>

<div
	role="status"
	aria-live="polite"
	class="flex items-start gap-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg"
>
	<!-- Icon -->
	<div class="flex-shrink-0 w-10 h-10 bg-blue-100 dark:bg-blue-900/40 rounded-lg flex items-center justify-center">
		<Info class="w-5 h-5 text-blue-600 dark:text-blue-400" />
	</div>

	<!-- Content -->
	<div class="flex-1 min-w-0">
		<p class="text-sm text-blue-900 dark:text-blue-100">
			This form has been prefilled with AI-generated content from chat.
			{#if sourceMessageId}
				<a
					href="/chat?message={sourceMessageId}"
					onclick={handleViewMessage}
					class="underline hover:no-underline focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
				>
					View original message
				</a>
			{/if}
		</p>
	</div>

	<!-- Close button -->
	<button
		type="button"
		class="flex-shrink-0 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
		onclick={handleDismiss}
		aria-label="Dismiss"
	>
		<X class="w-5 h-5" />
	</button>
</div>
