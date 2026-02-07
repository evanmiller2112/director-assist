<script lang="ts">
	/**
	 * NegotiationRulesReference Component
	 *
	 * Issue #394: Add Negotiation Reference Panel
	 *
	 * Collapsible reference panel showing Draw Steel negotiation rules:
	 * - Argument Outcomes Table
	 * - The 12 Motivations
	 * - Outcomes by Interest Level
	 */

	import { ChevronDown, ChevronUp, BookOpen } from 'lucide-svelte';

	let isExpanded = $state(false);

	function toggleExpanded() {
		isExpanded = !isExpanded;
	}

	// The 12 motivations from Draw Steel
	const motivations = [
		'Benevolence',
		'Discovery',
		'Freedom',
		'Greed',
		'Higher Authority',
		'Justice',
		'Legacy',
		'Peace',
		'Power',
		'Protection',
		'Revelry',
		'Vengeance'
	];
</script>

<div
	class="negotiation-rules-reference bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700"
>
	<!-- Header -->
	<button
		type="button"
		onclick={toggleExpanded}
		class="w-full flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
		aria-expanded={isExpanded}
		aria-controls="rules-content"
	>
		<div class="flex items-center gap-2">
			<BookOpen class="w-5 h-5 text-slate-600 dark:text-slate-400" />
			<h3 class="text-lg font-semibold text-slate-900 dark:text-white">Negotiation Rules</h3>
		</div>
		{#if isExpanded}
			<ChevronUp class="w-5 h-5 text-slate-600 dark:text-slate-400" />
		{:else}
			<ChevronDown class="w-5 h-5 text-slate-600 dark:text-slate-400" />
		{/if}
	</button>

	<!-- Content -->
	{#if isExpanded}
		<div id="rules-content" class="p-4 pt-0 space-y-6 border-t border-slate-200 dark:border-slate-700">
			<!-- Argument Outcomes Table -->
			<section>
				<h4 class="text-base font-semibold text-slate-900 dark:text-white mb-3">
					Argument Outcomes
				</h4>
				<div class="overflow-x-auto">
					<table class="w-full text-sm border border-slate-300 dark:border-slate-600">
						<thead class="bg-slate-100 dark:bg-slate-700">
							<tr>
								<th
									class="px-3 py-2 text-left font-semibold text-slate-900 dark:text-white border-b border-slate-300 dark:border-slate-600"
								>
									Argument Type
								</th>
								<th
									class="px-3 py-2 text-center font-semibold text-slate-900 dark:text-white border-b border-l border-slate-300 dark:border-slate-600"
								>
									Tier 1
								</th>
								<th
									class="px-3 py-2 text-center font-semibold text-slate-900 dark:text-white border-b border-l border-slate-300 dark:border-slate-600"
								>
									Tier 2
								</th>
								<th
									class="px-3 py-2 text-center font-semibold text-slate-900 dark:text-white border-b border-l border-slate-300 dark:border-slate-600"
								>
									Tier 3
								</th>
							</tr>
						</thead>
						<tbody class="bg-white dark:bg-slate-800">
							<tr>
								<td
									class="px-3 py-2 text-slate-900 dark:text-slate-100 border-b border-slate-300 dark:border-slate-600"
								>
									Motivation Appeal
								</td>
								<td
									class="px-3 py-2 text-center text-slate-700 dark:text-slate-300 border-b border-l border-slate-300 dark:border-slate-600"
								>
									<div>Int ±0</div>
									<div>Pat -1</div>
								</td>
								<td
									class="px-3 py-2 text-center text-slate-700 dark:text-slate-300 border-b border-l border-slate-300 dark:border-slate-600"
								>
									<div>Int +1</div>
									<div>Pat -1</div>
								</td>
								<td
									class="px-3 py-2 text-center text-slate-700 dark:text-slate-300 border-b border-l border-slate-300 dark:border-slate-600"
								>
									<div>Int +1</div>
									<div>Pat ±0</div>
								</td>
							</tr>
							<tr>
								<td
									class="px-3 py-2 text-slate-900 dark:text-slate-100 border-b border-slate-300 dark:border-slate-600"
								>
									No Motivation
								</td>
								<td
									class="px-3 py-2 text-center text-slate-700 dark:text-slate-300 border-b border-l border-slate-300 dark:border-slate-600"
								>
									<div>Int -1</div>
									<div>Pat -1</div>
								</td>
								<td
									class="px-3 py-2 text-center text-slate-700 dark:text-slate-300 border-b border-l border-slate-300 dark:border-slate-600"
								>
									<div>Int ±0</div>
									<div>Pat -1</div>
								</td>
								<td
									class="px-3 py-2 text-center text-slate-700 dark:text-slate-300 border-b border-l border-slate-300 dark:border-slate-600"
								>
									<div>Int +1</div>
									<div>Pat -1</div>
								</td>
							</tr>
							<tr>
								<td class="px-3 py-2 text-slate-900 dark:text-slate-100">Pitfall</td>
								<td
									class="px-3 py-2 text-center text-slate-700 dark:text-slate-300 border-l border-slate-300 dark:border-slate-600"
								>
									<div>Int -1</div>
									<div>Pat -1</div>
								</td>
								<td
									class="px-3 py-2 text-center text-red-600 dark:text-red-400 font-medium border-l border-slate-300 dark:border-slate-600"
								>
									Auto-fail
								</td>
								<td
									class="px-3 py-2 text-center text-red-600 dark:text-red-400 font-medium border-l border-slate-300 dark:border-slate-600"
								>
									Auto-fail
								</td>
							</tr>
						</tbody>
					</table>
				</div>
			</section>

			<!-- The 12 Motivations -->
			<section>
				<h4 class="text-base font-semibold text-slate-900 dark:text-white mb-3">
					The 12 Motivations
				</h4>
				<div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
					{#each motivations as motivation}
						<div
							class="px-3 py-2 text-sm text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-700 rounded border border-slate-200 dark:border-slate-600"
						>
							{motivation}
						</div>
					{/each}
				</div>
			</section>

			<!-- Outcomes by Interest Level -->
			<section>
				<h4 class="text-base font-semibold text-slate-900 dark:text-white mb-3">
					Outcomes by Interest Level
				</h4>
				<dl class="space-y-2 text-sm">
					<div
						class="flex gap-2 p-2 rounded bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
					>
						<dt class="font-semibold text-green-900 dark:text-green-200 min-w-[3rem]">5:</dt>
						<dd class="text-green-800 dark:text-green-300">
							<span class="font-medium">Alliance</span> - Everything requested plus bonus
						</dd>
					</div>
					<div
						class="flex gap-2 p-2 rounded bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800"
					>
						<dt class="font-semibold text-blue-900 dark:text-blue-200 min-w-[3rem]">4:</dt>
						<dd class="text-blue-800 dark:text-blue-300">
							<span class="font-medium">Major Favor</span> - Full agreement to request
						</dd>
					</div>
					<div
						class="flex gap-2 p-2 rounded bg-sky-50 dark:bg-sky-900/20 border border-sky-200 dark:border-sky-800"
					>
						<dt class="font-semibold text-sky-900 dark:text-sky-200 min-w-[3rem]">3:</dt>
						<dd class="text-sky-800 dark:text-sky-300">
							<span class="font-medium">Major Favor</span> - Agreement with some conditions
						</dd>
					</div>
					<div
						class="flex gap-2 p-2 rounded bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800"
					>
						<dt class="font-semibold text-amber-900 dark:text-amber-200 min-w-[3rem]">2:</dt>
						<dd class="text-amber-800 dark:text-amber-300">
							<span class="font-medium">Minor Favor</span> - Limited or reduced offer
						</dd>
					</div>
					<div
						class="flex gap-2 p-2 rounded bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
					>
						<dt class="font-semibold text-red-900 dark:text-red-200 min-w-[3rem]">1:</dt>
						<dd class="text-red-800 dark:text-red-300">
							<span class="font-medium">Failure</span> - Request rejected
						</dd>
					</div>
					<div
						class="flex gap-2 p-2 rounded bg-red-100 dark:bg-red-950/40 border border-red-300 dark:border-red-900"
					>
						<dt class="font-semibold text-red-950 dark:text-red-100 min-w-[3rem]">0:</dt>
						<dd class="text-red-900 dark:text-red-200">
							<span class="font-medium">Failure</span> - Hostile refusal, possible consequences
						</dd>
					</div>
				</dl>
			</section>
		</div>
	{/if}
</div>
