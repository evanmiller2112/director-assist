<script lang="ts">
	import type { MontageSession } from '$lib/types/montage';

	interface Props {
		montage: MontageSession;
	}

	let { montage }: Props = $props();

	const successPercent = $derived((montage.successCount / montage.successLimit) * 100);
	const failurePercent = $derived((montage.failureCount / montage.failureLimit) * 100);
</script>

<div class="space-y-3" role="region" aria-label="Montage progress">
	<!-- Success Progress -->
	<div>
		<div class="flex items-center justify-between mb-1">
			<span class="text-sm font-medium text-green-700 dark:text-green-400">Successes</span>
			<span class="text-sm font-medium text-green-700 dark:text-green-400">
				{montage.successCount} / {montage.successLimit}
			</span>
		</div>
		<div class="h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
			<div
				class="h-full bg-green-500 dark:bg-green-600 transition-all duration-300"
				style="width: {successPercent}%"
				role="progressbar"
				aria-valuenow={montage.successCount}
				aria-valuemin={0}
				aria-valuemax={montage.successLimit}
			></div>
		</div>
	</div>

	<!-- Failure Progress -->
	<div>
		<div class="flex items-center justify-between mb-1">
			<span class="text-sm font-medium text-red-700 dark:text-red-400">Failures</span>
			<span class="text-sm font-medium text-red-700 dark:text-red-400">
				{montage.failureCount} / {montage.failureLimit}
			</span>
		</div>
		<div class="h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
			<div
				class="h-full bg-red-500 dark:bg-red-600 transition-all duration-300"
				style="width: {failurePercent}%"
				role="progressbar"
				aria-valuenow={montage.failureCount}
				aria-valuemin={0}
				aria-valuemax={montage.failureLimit}
			></div>
		</div>
	</div>

	<!-- Metadata -->
	<div class="flex items-center gap-4 text-xs text-slate-600 dark:text-slate-400 pt-2">
		<div>
			<span class="font-medium">Round:</span>
			{montage.currentRound}
		</div>
		<div>
			<span class="font-medium">Challenges:</span>
			{montage.challenges.length}
		</div>
		<div>
			<span class="font-medium">Difficulty:</span>
			<span class="capitalize">{montage.difficulty}</span>
		</div>
	</div>
</div>
