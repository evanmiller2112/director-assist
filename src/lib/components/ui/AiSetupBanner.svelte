<script lang="ts">
	import { Settings, X } from 'lucide-svelte';

	interface Props {
		onGetStarted?: () => void;
		onPlayerDismiss?: () => void;
		onDisableAi?: () => void;
		// Legacy props for backwards compatibility
		onConfigure?: () => void;
		onDismiss?: () => void;
	}

	let { onGetStarted, onPlayerDismiss, onDisableAi, onConfigure, onDismiss }: Props = $props();

	function handleGetStarted() {
		onGetStarted?.() ?? onConfigure?.();
	}

	function handlePlayerDismiss() {
		onPlayerDismiss?.() ?? onDismiss?.();
	}

	function handleDisableAi() {
		onDisableAi?.();
	}

	function handleClose() {
		// Close button behaves like "I'm a Player" - just dismiss without disabling AI
		onPlayerDismiss?.() ?? onDismiss?.();
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
				onclick={handleGetStarted}
				aria-label="Get Started with AI configuration"
			>
				Get Started
			</button>
			<button
				type="button"
				class="btn btn-secondary border-blue-300 dark:border-blue-700 text-blue-900 dark:text-blue-100 hover:bg-blue-100 dark:hover:bg-blue-900/40 focus:ring-blue-500 text-sm px-3 py-1.5"
				onclick={handlePlayerDismiss}
				aria-label="I'm a Player - Dismiss this banner"
			>
				I'm a Player
			</button>
			<button
				type="button"
				class="btn btn-secondary border-blue-300 dark:border-blue-700 text-blue-900 dark:text-blue-100 hover:bg-blue-100 dark:hover:bg-blue-900/40 focus:ring-blue-500 text-sm px-3 py-1.5"
				onclick={handleDisableAi}
				aria-label="Not Using AI - Disable AI features"
			>
				Not Using AI
			</button>
		</div>
	</div>

	<!-- Close button -->
	<button
		type="button"
		class="flex-shrink-0 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
		onclick={handleClose}
		aria-label="Close"
	>
		<X class="w-5 h-5" />
	</button>
</div>
