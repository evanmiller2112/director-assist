<!--
  @component ErrorBoundary

  Issue #508: Add error boundaries and custom error page

  Catches errors in child components and displays a user-friendly fallback UI.
  Uses Svelte 5's <svelte:boundary> to catch rendering errors.

  @prop {string} [context='component'] - Context identifier for error logging
  @prop {string} [fallbackTitle='Something went wrong'] - Title for error fallback UI
  @prop {string} [fallbackDescription='This section encountered an error...'] - Description for error fallback UI
  @prop {Snippet} children - Child content to wrap with error boundary

  @example
  ```svelte
  <ErrorBoundary context="chat-panel" fallbackTitle="Chat Error">
    {#snippet children()}
      <ChatPanel />
    {/snippet}
  </ErrorBoundary>
  ```
-->
<script lang="ts">
	import { AlertTriangle, RefreshCw } from 'lucide-svelte';
	import { logError } from '$lib/services/errorLoggingService';
	import type { Snippet } from 'svelte';

	interface Props {
		context?: string;
		fallbackTitle?: string;
		fallbackDescription?: string;
		children: Snippet;
	}

	let {
		context = 'component',
		fallbackTitle = 'Something went wrong',
		fallbackDescription = 'This section encountered an error. Try again or reload the page.',
		children
	}: Props = $props();
</script>

<svelte:boundary onerror={(error) => logError({ message: `Error in ${context}`, error, context })}>
	{#snippet failed(error, reset)}
		<div role="alert" class="p-6 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg text-center">
			<div class="mx-auto w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center mb-3">
				<AlertTriangle class="w-5 h-5 text-red-600 dark:text-red-400" aria-hidden="true" />
			</div>
			<h3 class="text-sm font-medium text-red-900 dark:text-red-100 mb-1">{fallbackTitle}</h3>
			<p class="text-sm text-red-700 dark:text-red-300 mb-4">{fallbackDescription}</p>
			<button onclick={reset} class="btn btn-secondary text-sm">
				<RefreshCw class="w-4 h-4" aria-hidden="true" />
				Try Again
			</button>
		</div>
	{/snippet}
	{@render children()}
</svelte:boundary>
