<!--
  @component Combat Error Page

  Issue #508: Add error boundaries and custom error page

  Displays a combat-themed error page for errors in combat routes.
-->
<script lang="ts">
	import { page } from '$app/stores';
	import { Swords, Home, ArrowLeft, RefreshCw, ChevronDown, ChevronUp } from 'lucide-svelte';

	const status = $derived($page.status);
	const errorMessage = $derived($page.error?.message ?? 'An unexpected error occurred');

	const title = $derived.by(() => {
		if (status === 404) return 'Combat Not Found';
		if (status === 500) return 'Combat Error';
		return 'Error';
	});

	const description = $derived.by(() => {
		if (status === 404) return "The combat encounter you're looking for doesn't exist.";
		if (status === 500) return 'Something went wrong with this combat encounter.';
		return 'An error occurred while loading this combat.';
	});

	let showTechnicalDetails = $state(false);

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
		<div class="bg-white dark:bg-slate-800 rounded-lg shadow-xl p-8">
			<!-- Icon and Status -->
			<div class="flex justify-center mb-6">
				<div class="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
					<Swords class="w-8 h-8 text-red-600 dark:text-red-400" aria-hidden="true" />
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
				<a href="/combat" class="btn btn-primary flex-1">
					<Swords class="w-4 h-4" aria-hidden="true" />
					Combat List
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

			<!-- Technical Details -->
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
	</div>
</div>
