<script lang="ts">
	/**
	 * VictoryPointsConverter Component
	 *
	 * VP to XP conversion UI during respite.
	 */

	import { Trophy } from 'lucide-svelte';

	interface Props {
		available: number;
		converted: number;
		onConvert?: (amount: number) => void;
	}

	let { available, converted, onConvert }: Props = $props();

	let convertAmount = $state(1);

	const remaining = $derived(Math.max(0, available - converted));
	const percent = $derived(available > 0 ? (converted / available) * 100 : 0);

	function handleConvert() {
		if (convertAmount > 0 && convertAmount <= remaining) {
			onConvert?.(convertAmount);
			convertAmount = 1;
		}
	}

	function handleConvertAll() {
		if (remaining > 0) {
			onConvert?.(remaining);
		}
	}
</script>

<div class="space-y-4">
	<!-- VP Status -->
	<div class="flex items-center justify-between">
		<div class="flex items-center gap-2">
			<Trophy class="w-5 h-5 text-amber-500" />
			<span class="font-medium text-slate-900 dark:text-white">Victory Points</span>
		</div>
		<span class="text-sm text-slate-600 dark:text-slate-400">
			{converted}/{available} converted
		</span>
	</div>

	<!-- Progress Bar -->
	<div class="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3">
		<div
			class="bg-amber-500 h-3 rounded-full transition-all"
			style="width: {percent}%"
			role="progressbar"
			aria-label="Victory points converted"
			aria-valuenow={converted}
			aria-valuemin={0}
			aria-valuemax={available}
		></div>
	</div>

	<!-- Remaining -->
	<p class="text-sm text-slate-600 dark:text-slate-400">
		{remaining} VP remaining to convert
	</p>

	<!-- Conversion Controls -->
	{#if remaining > 0 && onConvert}
		<div class="flex gap-2 items-end">
			<div class="flex-1">
				<label for="convert-amount" class="block text-xs text-slate-600 dark:text-slate-400 mb-1">
					Amount to convert
				</label>
				<input
					id="convert-amount"
					type="number"
					min="1"
					max={remaining}
					bind:value={convertAmount}
					class="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
				/>
			</div>
			<button
				type="button"
				onclick={handleConvert}
				disabled={convertAmount <= 0 || convertAmount > remaining}
				class="rounded-md bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50"
			>
				Convert
			</button>
			<button
				type="button"
				onclick={handleConvertAll}
				class="rounded-md bg-amber-800 px-4 py-2 text-sm font-medium text-white hover:bg-amber-900"
			>
				All
			</button>
		</div>
	{:else if available === 0}
		<p class="text-sm text-slate-500 dark:text-slate-400 italic">No victory points available.</p>
	{:else if remaining === 0}
		<p class="text-sm text-green-600 dark:text-green-400 font-medium">All VP converted!</p>
	{/if}
</div>
