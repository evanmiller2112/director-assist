<script lang="ts">
	/**
	 * RespiteActivityCard Component
	 *
	 * Displays a single respite activity with type badge and status indicator.
	 */

	import type { RespiteActivity } from '$lib/types/respite';
	import { CheckCircle, Clock, Circle } from 'lucide-svelte';

	interface Props {
		activity: RespiteActivity;
		onComplete?: (activityId: string) => void;
		onStart?: (activityId: string) => void;
	}

	let { activity, onComplete, onStart }: Props = $props();

	const typeBadgeColors: Record<string, string> = {
		project: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
		crafting: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300',
		socializing: 'bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300',
		training: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300',
		investigation: 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300',
		other: 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
	};

	function formatType(type: string): string {
		return type.charAt(0).toUpperCase() + type.slice(1);
	}

	const statusIcon = $derived.by(() => {
		if (activity.status === 'completed') return CheckCircle;
		if (activity.status === 'in_progress') return Clock;
		return Circle;
	});

	const statusColor = $derived.by(() => {
		if (activity.status === 'completed') return 'text-green-600 dark:text-green-400';
		if (activity.status === 'in_progress') return 'text-blue-600 dark:text-blue-400';
		return 'text-slate-400 dark:text-slate-500';
	});
</script>

<div
	class="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4"
	data-testid="activity-card"
>
	<div class="flex items-start justify-between gap-3">
		<div class="flex items-start gap-2 flex-1">
			<svelte:component this={statusIcon} class="w-5 h-5 mt-0.5 {statusColor}" />
			<div class="flex-1">
				<h4 class="font-medium text-slate-900 dark:text-white">{activity.name}</h4>
				{#if activity.description}
					<p class="text-sm text-slate-600 dark:text-slate-400 mt-1">{activity.description}</p>
				{/if}
			</div>
		</div>

		<!-- Type Badge -->
		<span class="text-xs px-2 py-1 rounded-full font-medium {typeBadgeColors[activity.type] || typeBadgeColors.other}">
			{formatType(activity.type)}
		</span>
	</div>

	<!-- Hero Assignment -->
	{#if activity.heroId}
		<div class="mt-2 text-xs text-slate-500 dark:text-slate-400">
			Assigned to hero
		</div>
	{/if}

	<!-- Outcome -->
	{#if activity.outcome}
		<div class="mt-2 rounded-md bg-green-50 dark:bg-green-900/20 p-2 text-sm text-green-700 dark:text-green-300">
			{activity.outcome}
		</div>
	{/if}

	<!-- Notes -->
	{#if activity.notes}
		<p class="mt-2 text-sm text-slate-500 dark:text-slate-400 italic">{activity.notes}</p>
	{/if}

	<!-- Actions -->
	{#if activity.status !== 'completed'}
		<div class="mt-3 flex gap-2">
			{#if activity.status === 'pending' && onStart}
				<button
					type="button"
					onclick={() => onStart(activity.id)}
					class="text-xs px-3 py-1 rounded-md bg-blue-600 text-white hover:bg-blue-700"
				>
					Start
				</button>
			{/if}
			{#if onComplete}
				<button
					type="button"
					onclick={() => onComplete(activity.id)}
					class="text-xs px-3 py-1 rounded-md bg-green-600 text-white hover:bg-green-700"
				>
					Complete
				</button>
			{/if}
		</div>
	{/if}
</div>
