<script lang="ts">
	import { goto } from '$app/navigation';
	import { respiteStore } from '$lib/stores';
	import { RespiteSetup } from '$lib/components/respite';
	import { ArrowLeft } from 'lucide-svelte';

	interface RespiteSetupOutput {
		name: string;
		description?: string;
		heroes: Array<{
			name: string;
			heroId?: string;
			recoveries: { current: number; max: number };
		}>;
		victoryPointsAvailable: number;
	}

	async function handleCreate(data: RespiteSetupOutput) {
		const input = {
			name: data.name,
			description: data.description,
			heroes: data.heroes,
			victoryPointsAvailable: data.victoryPointsAvailable
		};

		const respite = await respiteStore.createRespite(input);
		goto(`/respite/${respite.id}`);
	}

	function handleCancel() {
		goto('/respite');
	}
</script>

<div class="new-respite-page p-6 max-w-2xl mx-auto">
	<!-- Back Button -->
	<button class="btn btn-secondary mb-6" onclick={handleCancel} aria-label="Back to respite list">
		<ArrowLeft class="w-4 h-4" />
		Back
	</button>

	<!-- Header -->
	<div class="mb-6">
		<h1 class="text-3xl font-bold text-slate-900 dark:text-white mb-2">New Respite</h1>
		<p class="text-slate-600 dark:text-slate-400">
			Set up a new Draw Steel respite session for your heroes.
		</p>
	</div>

	<!-- Setup Form -->
	<div class="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
		<RespiteSetup onCreate={handleCreate} onCancel={handleCancel} />
	</div>
</div>
