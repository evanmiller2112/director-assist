<script lang="ts">
	import { goto } from '$app/navigation';
	import { montageStore } from '$lib/stores';
	import { MontageSetup } from '$lib/components/montage';
	import { ArrowLeft } from 'lucide-svelte';
	import type { CreateMontageInput } from '$lib/types/montage';

	async function handleSubmit(input: CreateMontageInput) {
		const montage = await montageStore.createMontage(input);
		// Redirect to montage detail page
		goto(`/montage/${montage.id}`);
	}

	function handleCancel() {
		goto('/montage');
	}
</script>

<div class="new-montage-page p-6 max-w-2xl mx-auto">
	<!-- Back Button -->
	<button
		class="btn btn-secondary mb-6"
		onclick={handleCancel}
		aria-label="Back to montage list"
	>
		<ArrowLeft class="w-4 h-4" />
		Back
	</button>

	<!-- Header -->
	<div class="mb-6">
		<h1 class="text-3xl font-bold text-slate-900 dark:text-white mb-2">New Montage Session</h1>
		<p class="text-slate-600 dark:text-slate-400">
			Set up a new Draw Steel montage challenge for your heroes.
		</p>
	</div>

	<!-- Setup Form -->
	<div class="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
		<MontageSetup onSubmit={handleSubmit} onCancel={handleCancel} />
	</div>
</div>
