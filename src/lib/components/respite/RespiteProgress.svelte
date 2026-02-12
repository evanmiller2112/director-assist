<script lang="ts">
	/**
	 * RespiteProgress Component
	 *
	 * Overall respite progress indicators showing heroes, activities, and VP status.
	 */

	import type { RespiteSession } from '$lib/types/respite';
	import type { BaseEntity } from '$lib/types';
	import { Users, Activity, Trophy, Repeat } from 'lucide-svelte';

	interface Props {
		respite: RespiteSession;
		activityEntities?: BaseEntity[];
	}

	let { respite, activityEntities = [] }: Props = $props();

	const completedActivities = $derived(
		activityEntities.filter((a) => a.fields.activityStatus === 'completed').length
	);
	const totalActivities = $derived(activityEntities.length);

	const vpRemaining = $derived(
		Math.max(0, respite.victoryPointsAvailable - respite.victoryPointsConverted)
	);

	const heroesFullyRested = $derived(
		respite.heroes.filter((h) => h.recoveries.current >= h.recoveries.max).length
	);
</script>

<div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
	<!-- Heroes -->
	<div class="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
		<div class="flex items-center gap-2 mb-2">
			<Users class="w-4 h-4 text-blue-500" />
			<span class="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Heroes</span>
		</div>
		<div class="text-2xl font-bold text-slate-900 dark:text-white">{respite.heroes.length}</div>
		<div class="text-xs text-slate-500 dark:text-slate-400">{heroesFullyRested} fully rested</div>
	</div>

	<!-- Activities -->
	<div class="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
		<div class="flex items-center gap-2 mb-2">
			<Activity class="w-4 h-4 text-green-500" />
			<span class="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Activities</span>
		</div>
		<div class="text-2xl font-bold text-slate-900 dark:text-white">
			{completedActivities}/{totalActivities}
		</div>
		<div class="text-xs text-slate-500 dark:text-slate-400">completed</div>
	</div>

	<!-- Victory Points -->
	<div class="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
		<div class="flex items-center gap-2 mb-2">
			<Trophy class="w-4 h-4 text-amber-500" />
			<span class="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">VP</span>
		</div>
		<div class="text-2xl font-bold text-slate-900 dark:text-white">
			{respite.victoryPointsConverted}/{respite.victoryPointsAvailable}
		</div>
		<div class="text-xs text-slate-500 dark:text-slate-400">{vpRemaining} remaining</div>
	</div>

	<!-- Kit Swaps -->
	<div class="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
		<div class="flex items-center gap-2 mb-2">
			<Repeat class="w-4 h-4 text-purple-500" />
			<span class="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Kit Swaps</span>
		</div>
		<div class="text-2xl font-bold text-slate-900 dark:text-white">{respite.kitSwaps.length}</div>
		<div class="text-xs text-slate-500 dark:text-slate-400">recorded</div>
	</div>
</div>
