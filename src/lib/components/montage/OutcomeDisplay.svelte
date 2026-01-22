<script lang="ts">
	import type { MontageOutcome } from '$lib/types/montage';
	import { Trophy, AlertTriangle, Award } from 'lucide-svelte';

	interface Props {
		outcome: MontageOutcome;
		victoryPoints: number;
	}

	let { outcome, victoryPoints }: Props = $props();

	function getOutcomeConfig(outcome: MontageOutcome) {
		switch (outcome) {
			case 'total_success':
				return {
					icon: Trophy,
					label: 'Total Success',
					description: 'You achieved complete success!',
					color: 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
				};
			case 'partial_success':
				return {
					icon: Award,
					label: 'Partial Success',
					description: 'You succeeded, but with complications.',
					color: 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
				};
			case 'total_failure':
				return {
					icon: AlertTriangle,
					label: 'Total Failure',
					description: 'The montage failed to achieve its goal.',
					color: 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
				};
		}
	}

	const config = getOutcomeConfig(outcome);
	const Icon = config.icon;
</script>

<div
	class="outcome-display rounded-lg border-2 p-6 {config.color}"
	role="status"
	aria-label="Montage outcome"
>
	<div class="flex items-start gap-4">
		<div class="mt-1">
			<Icon class="h-8 w-8" />
		</div>

		<div class="flex-1">
			<h3 class="text-xl font-bold mb-1">{config.label}</h3>
			<p class="text-sm opacity-90 mb-3">{config.description}</p>

			{#if victoryPoints > 0}
				<div class="flex items-center gap-2 font-semibold">
					<Trophy class="h-5 w-5" />
					<span>{victoryPoints} Victory {victoryPoints === 1 ? 'Point' : 'Points'} Earned</span>
				</div>
			{:else}
				<div class="text-sm opacity-75">No Victory Points earned</div>
			{/if}
		</div>
	</div>
</div>

<style>
	.outcome-display {
		animation: slideIn 0.3s ease-out;
	}

	@keyframes slideIn {
		from {
			opacity: 0;
			transform: translateY(-10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
</style>
