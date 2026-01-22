<script lang="ts">
	import type { MontageChallenge } from '$lib/types/montage';
	import { CheckCircle, XCircle, SkipForward } from 'lucide-svelte';

	interface Props {
		challenge: MontageChallenge;
		index: number;
	}

	let { challenge, index }: Props = $props();

	function getResultIcon(result: MontageChallenge['result']) {
		switch (result) {
			case 'success':
				return CheckCircle;
			case 'failure':
				return XCircle;
			case 'skip':
				return SkipForward;
			default:
				return null;
		}
	}

	function getResultColor(result: MontageChallenge['result']): string {
		switch (result) {
			case 'success':
				return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20';
			case 'failure':
				return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20';
			case 'skip':
				return 'text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/20';
			default:
				return 'text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/20';
		}
	}

	const ResultIcon = getResultIcon(challenge.result);
</script>

<div
	class="challenge-card rounded-lg border p-3 {getResultColor(challenge.result)}"
	role="article"
	aria-label="Challenge {index}"
>
	<div class="flex items-start gap-3">
		{#if ResultIcon}
			<div class="mt-0.5">
				<ResultIcon class="h-5 w-5" />
			</div>
		{/if}

		<div class="flex-1">
			<div class="flex items-center gap-2 mb-1">
				<span class="font-medium">Challenge {index}</span>
				<span class="text-xs opacity-75">Round {challenge.round}</span>
			</div>

			{#if challenge.description}
				<p class="text-sm mb-1">{challenge.description}</p>
			{/if}

			{#if challenge.playerName}
				<p class="text-xs opacity-75">Player: {challenge.playerName}</p>
			{/if}

			{#if challenge.notes}
				<p class="text-xs mt-2 italic opacity-75">{challenge.notes}</p>
			{/if}
		</div>
	</div>
</div>

<style>
	.challenge-card {
		transition: all 0.2s;
	}
</style>
