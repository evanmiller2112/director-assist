<script lang="ts">
	import { Settings, X } from 'lucide-svelte';

	interface Props {
		onConfigure?: () => void;
		onDismiss?: () => void;
	}

	let { onConfigure, onDismiss }: Props = $props();

	function handleConfigure() {
		onConfigure?.();
	}

	function handleDismiss() {
		onDismiss?.();
	}
</script>

<div
	role="alert"
	aria-live="polite"
	class="flex items-start gap-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg w-full"
>
	<!-- Icon -->
	<div class="flex-shrink-0 w-10 h-10 bg-blue-100 dark:bg-blue-900/40 rounded-lg flex items-center justify-center">
		<Settings class="w-5 h-5 text-blue-600 dark:text-blue-400" />
	</div>

	<!-- Content -->
	<div class="flex-1 min-w-0">
		<p class="text-sm text-blue-900 dark:text-blue-100 mb-3">
			Unlock AI-powered features! Add an API key to generate content, improve descriptions, and get AI assistance throughout your campaign.
		</p>

		<!-- Action buttons -->
		<div class="flex flex-wrap gap-2">
			<button
				type="button"
				class="btn btn-primary bg-blue-600 hover:bg-blue-700 text-white border-0 focus:ring-blue-500 text-sm px-3 py-1.5"
				onclick={handleConfigure}
			>
				Get Started
			</button>
			<button
				type="button"
				class="btn btn-secondary border-blue-300 dark:border-blue-700 text-blue-900 dark:text-blue-100 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-sm px-3 py-1.5"
				onclick={handleDismiss}
			>
				Not Now
			</button>
		</div>
	</div>

	<!-- Close button -->
	<button
		type="button"
		class="flex-shrink-0 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
		onclick={handleDismiss}
		aria-label="Close"
	>
		<X class="w-5 h-5" />
	</button>
</div>
