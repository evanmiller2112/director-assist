<script lang="ts">
	import { ChevronUp, ChevronDown } from 'lucide-svelte';
	import type { CombatSession, Combatant } from '$lib/types/combat';
	import CombatantCard from './CombatantCard.svelte';

	interface Props {
		combat: CombatSession;
		onCombatantClick?: (combatant: Combatant) => void;
		onReorder?: (combatantId: string, newPosition: number) => void | Promise<void>;
		compact?: boolean;
	}

	let { combat, onCombatantClick, onReorder, compact = false }: Props = $props();

	// Use array order directly (no auto-sort)
	const combatants = $derived(combat.combatants);

	const isClickable = $derived(onCombatantClick !== undefined);
	const canReorder = $derived(onReorder !== undefined);

	function handleMoveUp(combatantId: string, currentIndex: number) {
		if (onReorder && currentIndex > 0) {
			onReorder(combatantId, currentIndex - 1);
		}
	}

	function handleMoveDown(combatantId: string, currentIndex: number) {
		if (onReorder && currentIndex < combatants.length - 1) {
			onReorder(combatantId, currentIndex + 1);
		}
	}

	function handlePositionChange(combatantId: string, event: Event) {
		const input = event.target as HTMLInputElement;
		const newPosition = parseInt(input.value, 10) - 1; // Convert 1-indexed to 0-indexed
		if (onReorder && !isNaN(newPosition)) {
			onReorder(combatantId, newPosition);
		}
	}

	function handlePositionKeydown(combatantId: string, currentIndex: number, event: KeyboardEvent) {
		if (event.key === 'Enter') {
			const input = event.target as HTMLInputElement;
			const newPosition = parseInt(input.value, 10) - 1;
			if (onReorder && !isNaN(newPosition)) {
				onReorder(combatantId, newPosition);
			}
			input.blur();
		} else if (event.key === 'Escape') {
			const input = event.target as HTMLInputElement;
			input.value = String(currentIndex + 1);
			input.blur();
		}
	}
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
	{#if combatants.length === 0}
		<div class="p-8 text-center text-slate-500 dark:text-slate-400">
			<p>No combatants in initiative order</p>
		</div>
	{:else}
		<ul
			class="divide-y divide-slate-200 dark:divide-slate-700"
			role="list"
			aria-label="Initiative order and turn tracker"
		>
			{#each combatants as combatant, index}
				{@const isCurrent = index === combat.currentTurn}
				<li
					class={`transition-colors ${
						!isClickable ? '' : 'hover:bg-slate-50 dark:hover:bg-slate-800'
					}`}
					role="listitem"
					aria-current={isCurrent ? 'true' : undefined}
				>
					<div class="p-3 flex items-start gap-2">
						{#if canReorder}
							<div class="flex flex-col items-center gap-0.5 pt-1">
								<button
									class="p-0.5 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:text-slate-300 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed"
									onclick={() => handleMoveUp(combatant.id, index)}
									disabled={index === 0}
									aria-label="Move up"
								>
									<ChevronUp class="w-4 h-4" />
								</button>
								<input
									type="number"
									min="1"
									max={combatants.length}
									value={index + 1}
									onchange={(e) => handlePositionChange(combatant.id, e)}
									onkeydown={(e) => handlePositionKeydown(combatant.id, index, e)}
									class="w-8 h-6 text-center text-xs font-medium bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
									aria-label="Position in initiative order"
								/>
								<button
									class="p-0.5 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:text-slate-300 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed"
									onclick={() => handleMoveDown(combatant.id, index)}
									disabled={index === combatants.length - 1}
									aria-label="Move down"
								>
									<ChevronDown class="w-4 h-4" />
								</button>
							</div>
						{/if}
						<div class="flex-1 min-w-0">
							<CombatantCard
								{combatant}
								{isCurrent}
								onClick={onCombatantClick}
								{compact}
							/>
						</div>
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
