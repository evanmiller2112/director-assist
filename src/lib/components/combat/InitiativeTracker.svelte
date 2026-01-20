<script lang="ts">
	import type { CombatSession, Combatant } from '$lib/types/combat';
	import CombatantCard from './CombatantCard.svelte';

	interface Props {
		combat: CombatSession;
		onCombatantClick?: (combatant: Combatant) => void;
		compact?: boolean;
	}

	let { combat, onCombatantClick, compact = false }: Props = $props();

	const sortedCombatants = $derived(
		[...combat.combatants].sort((a, b) => b.initiative - a.initiative)
	);

	const isClickable = $derived(onCombatantClick !== undefined);
</script>

<div class={`initiative-tracker ${compact ? 'compact' : ''} responsive`}>
	<!-- Round Header -->
	<div class="p-4 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
		{#if combat.status === 'preparing' || combat.currentRound === 0}
			<div class="text-center text-slate-600 dark:text-slate-400">
				Preparing for Combat
			</div>
		{:else}
			<div class="text-center">
				<div class="text-sm text-slate-600 dark:text-slate-400">Round</div>
				<div class="text-2xl font-bold text-slate-900 dark:text-white">
					{combat.currentRound}
				</div>
			</div>
		{/if}
	</div>

	<!-- Combatants List -->
	{#if sortedCombatants.length === 0}
		<div class="p-8 text-center text-slate-500 dark:text-slate-400">
			<p>No combatants in initiative order</p>
		</div>
	{:else}
		<ul
			class="divide-y divide-slate-200 dark:divide-slate-700"
			role="list"
			aria-label="Initiative order and turn tracker"
		>
			{#each sortedCombatants as combatant, index}
				{@const isCurrent = combat.combatants.indexOf(combatant) === combat.currentTurn}
				<li
					class={`transition-colors ${
						!isClickable ? '' : 'hover:bg-slate-50 dark:hover:bg-slate-800'
					}`}
					role="listitem"
					aria-current={isCurrent ? 'true' : undefined}
				>
					<div class="p-3">
						<CombatantCard
							{combatant}
							{isCurrent}
							onClick={onCombatantClick}
							{compact}
						/>
					</div>
				</li>
			{/each}
		</ul>
	{/if}
</div>

<style>
	.initiative-tracker {
		@apply h-full overflow-y-auto;
	}

	.initiative-tracker.compact ul {
		@apply divide-y-0;
	}

	.initiative-tracker.compact li {
		@apply p-1;
	}
</style>
