<!--
  @component Root Error Page

  Issue #508: Add error boundaries and custom error page

  Displays a user-friendly error page for unhandled errors at any route.
  Shows context-specific messaging based on status code (404, 500, etc.)
  with options to navigate back, refresh, or go to dashboard.
-->
<script lang="ts">
	import { page } from '$app/stores';
	import { AlertTriangle, Home, ArrowLeft, RefreshCw, ChevronDown, ChevronUp } from 'lucide-svelte';

	// Reactive values derived from $page store
	const status = $derived($page.status);
	const errorMessage = $derived($page.error?.message ?? 'An unexpected error occurred');

	// Reactive title based on status
	const title = $derived.by(() => {
		if (status === 404) return 'Page Not Found';
		if (status === 403) return 'Access Forbidden';
		if (status === 500) return 'Internal Error';
		if (status >= 500) return 'Server Error';
		if (status >= 400) return 'Request Error';
		return 'Error';
	});

	// Reactive description based on status
	const description = $derived.by(() => {
		if (status === 404) return "The page you're looking for doesn't exist or has been moved.";
		if (status === 403) return "You don't have permission to access this resource.";
		if (status === 500) return 'Something went wrong on our end. Please try again.';
		if (status >= 500) return 'The server encountered an error. Please try again later.';
		return 'An error occurred while processing your request.';
	});

	// Technical details collapsed state
	let showTechnicalDetails = $state(false);

	// Navigation actions
	function goBack() {
		window.history.back();
	}

	function reload() {
		window.location.reload();
	}
</script>

<svelte:head>
	<title>{title} - Director Assist</title>
</svelte:head>

<div class="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-4">
	<div class="max-w-2xl w-full">
		<!-- Error Card -->
		<div class="bg-white dark:bg-slate-800 rounded-lg shadow-xl p-8">
			<!-- Icon and Status -->
			<div class="flex justify-center mb-6">
				<div class="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
					<AlertTriangle class="w-8 h-8 text-red-600 dark:text-red-400" aria-hidden="true" />
				</div>
			</div>

			<!-- Status Code -->
			<div class="text-center mb-4">
				<p class="text-6xl font-bold text-slate-400 dark:text-slate-600">{status}</p>
			</div>

			<!-- Title and Description -->
			<div class="text-center mb-8">
				<h1 class="text-2xl font-bold text-slate-900 dark:text-white mb-2">
					{title}
				</h1>
				<p class="text-slate-600 dark:text-slate-400">
					{description}
				</p>
			</div>

			<!-- Action Buttons -->
			<div class="flex flex-col sm:flex-row gap-3 mb-6">
				<a href="/" class="btn btn-primary flex-1">
					<Home class="w-4 h-4" aria-hidden="true" />
					Go to Dashboard
				</a>
				<button onclick={goBack} class="btn btn-secondary flex-1">
					<ArrowLeft class="w-4 h-4" aria-hidden="true" />
					Go Back
				</button>
				<button onclick={reload} class="btn btn-secondary flex-1">
					<RefreshCw class="w-4 h-4" aria-hidden="true" />
					Refresh
				</button>
			</div>

			<!-- Technical Details (Collapsible) -->
			<div class="border-t border-slate-200 dark:border-slate-700 pt-6">
				<button
					onclick={() => showTechnicalDetails = !showTechnicalDetails}
					class="w-full flex items-center justify-between text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
				>
					<span>Technical Details</span>
					{#if showTechnicalDetails}
						<ChevronUp class="w-4 h-4" aria-hidden="true" />
					{:else}
						<ChevronDown class="w-4 h-4" aria-hidden="true" />
					{/if}
				</button>

				{#if showTechnicalDetails}
					<div class="mt-4 p-4 bg-slate-100 dark:bg-slate-900 rounded-md">
						<dl class="space-y-2 text-sm">
							<div>
								<dt class="font-medium text-slate-700 dark:text-slate-300">Status Code:</dt>
								<dd class="text-slate-600 dark:text-slate-400">{status}</dd>
							</div>
							<div>
								<dt class="font-medium text-slate-700 dark:text-slate-300">Error Message:</dt>
								<dd class="text-slate-600 dark:text-slate-400 break-words">{errorMessage}</dd>
							</div>
							<div>
								<dt class="font-medium text-slate-700 dark:text-slate-300">Path:</dt>
								<dd class="text-slate-600 dark:text-slate-400 break-all">{$page.url.pathname}</dd>
							</div>
						</dl>
					</div>
				{/if}
			</div>
		</div>

		<!-- Help Text -->
		<div class="text-center mt-6">
			<p class="text-sm text-slate-500 dark:text-slate-400">
				If this problem persists, please report it on our GitHub repository.
			</p>
		</div>
	</div>
</div>
