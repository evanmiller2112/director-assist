<script lang="ts">
	import type { CombatCondition } from '$lib/types/combat';

	interface Props {
		condition: CombatCondition;
		showTooltip?: boolean;
	}

	let { condition, showTooltip = true }: Props = $props();

	let showDescription = $state(false);

	function getDurationText(duration: number): string {
		if (duration === -1) return 'Permanent';
		if (duration === 0) return 'Until end of combat';
		return `${duration} ${duration === 1 ? 'round' : 'rounds'}`;
	}

	function handleMouseEnter() {
		if (showTooltip && condition.description) {
			showDescription = true;
		}
	}

	function handleMouseLeave() {
		showDescription = false;
	}
</script>

<div
	class="condition-badge relative inline-flex items-center gap-1 rounded-full bg-amber-100 dark:bg-amber-900 px-2 py-1 text-xs font-medium text-amber-800 dark:text-amber-200"
	onmouseenter={handleMouseEnter}
	onmouseleave={handleMouseLeave}
	role="status"
	aria-label={`${condition.name} condition, ${getDurationText(condition.duration)}`}
>
	<span>{condition.name}</span>
	{#if condition.duration >= 0}
		<span class="text-amber-600 dark:text-amber-400">
			{condition.duration === 0 ? '∞' : condition.duration}
		</span>
	{/if}

	{#if showDescription && condition.description}
		<div
			class="absolute top-full left-0 mt-1 z-10 w-48 rounded-md bg-slate-900 dark:bg-slate-800 px-3 py-2 text-xs text-white shadow-lg"
			role="tooltip"
		>
			{condition.description}
			{#if condition.source}
				<div class="mt-1 text-slate-400">Source: {condition.source}</div>
			{/if}
		</div>
	{/if}
</div>

<style>
	.condition-badge {
		transition: background-color 0.2s;
	}
</style>
