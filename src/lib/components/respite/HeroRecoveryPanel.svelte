<script lang="ts">
	/**
	 * HeroRecoveryPanel Component
	 *
	 * Displays recovery tracking per hero with color-coded status:
	 * - Red: < 25% recoveries
	 * - Yellow: 25-75% recoveries
	 * - Green: > 75% recoveries
	 */

	import type { RespiteHero } from '$lib/types/respite';
	import { Heart, Plus, Minus } from 'lucide-svelte';

	interface Props {
		heroes: RespiteHero[];
		onUpdateRecovery?: (heroId: string, gained: number) => void;
	}

	let { heroes, onUpdateRecovery }: Props = $props();

	function getRecoveryColor(hero: RespiteHero): string {
		const percent = hero.recoveries.current / hero.recoveries.max;
		if (percent < 0.25) return 'text-red-600 dark:text-red-400';
		if (percent < 0.75) return 'text-yellow-600 dark:text-yellow-400';
		return 'text-green-600 dark:text-green-400';
	}

	function getRecoveryBgColor(hero: RespiteHero): string {
		const percent = hero.recoveries.current / hero.recoveries.max;
		if (percent < 0.25) return 'bg-red-500';
		if (percent < 0.75) return 'bg-yellow-500';
		return 'bg-green-500';
	}

	function handleGainRecovery(heroId: string, currentGained: number) {
		onUpdateRecovery?.(heroId, currentGained + 1);
	}

	function handleLoseRecovery(heroId: string, currentGained: number) {
		if (currentGained > 0) {
			onUpdateRecovery?.(heroId, currentGained - 1);
		}
	}
</script>

<div class="space-y-3">
	{#if heroes.length === 0}
		<p class="text-sm text-slate-500 dark:text-slate-400">No heroes in this respite.</p>
	{:else}
		{#each heroes as hero (hero.id)}
			<div
				class="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4"
				data-testid="hero-recovery-card"
			>
				<div class="flex items-center justify-between mb-2">
					<div class="flex items-center gap-2">
						<Heart class="w-4 h-4 {getRecoveryColor(hero)}" />
						<span class="font-medium text-slate-900 dark:text-white">{hero.name}</span>
					</div>
					<span class="text-sm {getRecoveryColor(hero)} font-semibold">
						{hero.recoveries.current}/{hero.recoveries.max}
					</span>
				</div>

				<!-- Recovery Bar -->
				<div class="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5 mb-2">
					<div
						class="{getRecoveryBgColor(hero)} h-2.5 rounded-full transition-all"
						style="width: {(hero.recoveries.current / hero.recoveries.max) * 100}%"
						role="progressbar"
						aria-label="{hero.name} recovery"
						aria-valuenow={hero.recoveries.current}
						aria-valuemin={0}
						aria-valuemax={hero.recoveries.max}
					></div>
				</div>

				<!-- Controls -->
				{#if onUpdateRecovery}
					<div class="flex items-center justify-between mt-2">
						<span class="text-xs text-slate-500 dark:text-slate-400">
							Gained: {hero.recoveries.gained}
						</span>
						<div class="flex gap-1">
							<button
								type="button"
								onclick={() => handleLoseRecovery(hero.id, hero.recoveries.gained)}
								disabled={hero.recoveries.gained <= 0}
								class="p-1 rounded text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30"
								aria-label="Decrease recovery for {hero.name}"
							>
								<Minus class="w-4 h-4" />
							</button>
							<button
								type="button"
								onclick={() => handleGainRecovery(hero.id, hero.recoveries.gained)}
								disabled={hero.recoveries.current >= hero.recoveries.max}
								class="p-1 rounded text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30"
								aria-label="Increase recovery for {hero.name}"
							>
								<Plus class="w-4 h-4" />
							</button>
						</div>
					</div>
				{/if}

				<!-- Conditions -->
				{#if hero.conditions && hero.conditions.length > 0}
					<div class="mt-2 flex flex-wrap gap-1">
						{#each hero.conditions as condition}
							<span class="text-xs px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300">
								{condition}
							</span>
						{/each}
					</div>
				{/if}

				<!-- Notes -->
				{#if hero.notes}
					<p class="mt-2 text-xs text-slate-500 dark:text-slate-400 italic">{hero.notes}</p>
				{/if}
			</div>
		{/each}
	{/if}
</div>
