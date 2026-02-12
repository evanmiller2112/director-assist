<script lang="ts">
	/**
	 * RespiteAnalytics Component
	 *
	 * Displays analytics and statistics about respite sessions.
	 */

	import { respiteStore } from '$lib/stores';
	import { BarChart3 } from 'lucide-svelte';

	const totalCompleted = $derived(respiteStore.completedRespites.length);
	const totalVP = $derived(respiteStore.totalVPConverted);
	const totalActivities = $derived(respiteStore.totalActivitiesCompleted);
	const distribution = $derived(respiteStore.activityTypeDistribution);

	const activityTypeLabels: Record<string, string> = {
		project: 'Project',
		crafting: 'Crafting',
		socializing: 'Socializing',
		training: 'Training',
		investigation: 'Investigation',
		other: 'Other'
	};

	const activityTypeColors: Record<string, string> = {
		project: 'bg-blue-500',
		crafting: 'bg-orange-500',
		socializing: 'bg-pink-500',
		training: 'bg-purple-500',
		investigation: 'bg-cyan-500',
		other: 'bg-slate-500'
	};

	const distributionEntries = $derived.by(() => {
		return Object.entries(distribution).sort(([, a], [, b]) => b - a);
	});

	const maxCount = $derived.by(() => {
		return Math.max(1, ...Object.values(distribution));
	});
</script>

<div class="space-y-6">
	<div class="flex items-center gap-2 mb-4">
		<BarChart3 class="w-5 h-5 text-slate-600 dark:text-slate-400" />
		<h3 class="text-lg font-semibold text-slate-900 dark:text-white">Respite Analytics</h3>
	</div>

	<!-- Summary Stats -->
	<div class="grid grid-cols-3 gap-4">
		<div class="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 text-center">
			<div class="text-2xl font-bold text-slate-900 dark:text-white">{totalCompleted}</div>
			<div class="text-xs text-slate-500 dark:text-slate-400">Respites Completed</div>
		</div>
		<div class="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 text-center">
			<div class="text-2xl font-bold text-amber-600 dark:text-amber-400">{totalVP}</div>
			<div class="text-xs text-slate-500 dark:text-slate-400">Total VP Converted</div>
		</div>
		<div class="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 text-center">
			<div class="text-2xl font-bold text-green-600 dark:text-green-400">{totalActivities}</div>
			<div class="text-xs text-slate-500 dark:text-slate-400">Activities Completed</div>
		</div>
	</div>

	<!-- Activity Type Distribution -->
	{#if distributionEntries.length > 0}
		<div>
			<h4 class="text-sm font-medium text-slate-900 dark:text-white mb-3">Activity Distribution</h4>
			<div class="space-y-2">
				{#each distributionEntries as [type, count]}
					<div class="flex items-center gap-3">
						<span class="text-xs text-slate-600 dark:text-slate-400 w-24">
							{activityTypeLabels[type] || type}
						</span>
						<div class="flex-1 bg-slate-200 dark:bg-slate-700 rounded-full h-4">
							<div
								class="{activityTypeColors[type] || 'bg-slate-500'} h-4 rounded-full transition-all"
								style="width: {(count / maxCount) * 100}%"
							></div>
						</div>
						<span class="text-xs font-medium text-slate-900 dark:text-white w-8 text-right">{count}</span>
					</div>
				{/each}
			</div>
		</div>
	{/if}
</div>
