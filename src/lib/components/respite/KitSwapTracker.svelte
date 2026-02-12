<script lang="ts">
	/**
	 * KitSwapTracker Component
	 *
	 * Records and displays kit swaps during respite.
	 */

	import type { KitSwap, RespiteHero } from '$lib/types/respite';
	import { ArrowRight } from 'lucide-svelte';

	interface Props {
		kitSwaps: KitSwap[];
		heroes: RespiteHero[];
		onSwap?: (swap: { heroId: string; from: string; to: string; reason?: string }) => void;
	}

	let { kitSwaps, heroes, onSwap }: Props = $props();

	let selectedHeroId = $state('');
	let fromKit = $state('');
	let toKit = $state('');
	let reason = $state('');

	function handleSwap() {
		if (!selectedHeroId || !fromKit.trim() || !toKit.trim()) return;

		onSwap?.({
			heroId: selectedHeroId,
			from: fromKit.trim(),
			to: toKit.trim(),
			reason: reason.trim() || undefined
		});

		// Reset form
		fromKit = '';
		toKit = '';
		reason = '';
	}

	function getHeroName(heroId: string): string {
		return heroes.find((h) => h.id === heroId)?.name || 'Unknown';
	}
</script>

<div class="space-y-4">
	<!-- Record New Swap -->
	{#if onSwap && heroes.length > 0}
		<div class="space-y-3 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
			<h4 class="text-sm font-medium text-slate-900 dark:text-white">Record Kit Swap</h4>

			<!-- Hero Select -->
			<div>
				<label for="swap-hero" class="block text-xs text-slate-600 dark:text-slate-400 mb-1">Hero</label>
				<select
					id="swap-hero"
					bind:value={selectedHeroId}
					class="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
				>
					<option value="">Select hero...</option>
					{#each heroes as hero}
						<option value={hero.id}>{hero.name}</option>
					{/each}
				</select>
			</div>

			<!-- From/To -->
			<div class="flex gap-2 items-end">
				<div class="flex-1">
					<label for="swap-from" class="block text-xs text-slate-600 dark:text-slate-400 mb-1">From Kit</label>
					<input
						id="swap-from"
						type="text"
						bind:value={fromKit}
						placeholder="Current kit"
						class="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
					/>
				</div>
				<ArrowRight class="w-5 h-5 text-slate-400 mb-2" />
				<div class="flex-1">
					<label for="swap-to" class="block text-xs text-slate-600 dark:text-slate-400 mb-1">To Kit</label>
					<input
						id="swap-to"
						type="text"
						bind:value={toKit}
						placeholder="New kit"
						class="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
					/>
				</div>
			</div>

			<!-- Reason -->
			<div>
				<label for="swap-reason" class="block text-xs text-slate-600 dark:text-slate-400 mb-1">Reason (optional)</label>
				<input
					id="swap-reason"
					type="text"
					bind:value={reason}
					placeholder="Why are they swapping?"
					class="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
				/>
			</div>

			<button
				type="button"
				onclick={handleSwap}
				disabled={!selectedHeroId || !fromKit.trim() || !toKit.trim()}
				class="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
			>
				Record Swap
			</button>
		</div>
	{/if}

	<!-- Swap History -->
	{#if kitSwaps.length > 0}
		<div class="space-y-2">
			<h4 class="text-sm font-medium text-slate-900 dark:text-white">Swap History</h4>
			{#each kitSwaps as swap (swap.id)}
				<div class="flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-3 text-sm">
					<span class="font-medium text-slate-900 dark:text-white">{getHeroName(swap.heroId)}</span>
					<span class="text-slate-500 dark:text-slate-400">{swap.from}</span>
					<ArrowRight class="w-4 h-4 text-slate-400" />
					<span class="text-slate-900 dark:text-white">{swap.to}</span>
					{#if swap.reason}
						<span class="text-xs text-slate-500 dark:text-slate-400 italic ml-auto">({swap.reason})</span>
					{/if}
				</div>
			{/each}
		</div>
	{:else}
		<p class="text-sm text-slate-500 dark:text-slate-400">No kit swaps recorded.</p>
	{/if}
</div>
