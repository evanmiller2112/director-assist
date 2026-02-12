<script lang="ts">
	/**
	 * RespiteRulesReference Component
	 *
	 * Collapsible Draw Steel respite rules reference panel.
	 */

	import { ChevronDown, ChevronUp, BookOpen } from 'lucide-svelte';

	let isExpanded = $state(false);

	function toggleExpanded() {
		isExpanded = !isExpanded;
	}
</script>

<div class="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
	<!-- Header -->
	<button
		type="button"
		onclick={toggleExpanded}
		class="w-full flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
		aria-expanded={isExpanded}
		aria-controls="respite-rules-content"
	>
		<div class="flex items-center gap-2">
			<BookOpen class="w-5 h-5 text-slate-600 dark:text-slate-400" />
			<h3 class="text-lg font-semibold text-slate-900 dark:text-white">Respite Rules</h3>
		</div>
		{#if isExpanded}
			<ChevronUp class="w-5 h-5 text-slate-600 dark:text-slate-400" />
		{:else}
			<ChevronDown class="w-5 h-5 text-slate-600 dark:text-slate-400" />
		{/if}
	</button>

	<!-- Content -->
	{#if isExpanded}
		<div id="respite-rules-content" class="p-4 pt-0 space-y-6 border-t border-slate-200 dark:border-slate-700">
			<!-- What is a Respite -->
			<section>
				<h4 class="text-base font-semibold text-slate-900 dark:text-white mb-2">What is a Respite?</h4>
				<p class="text-sm text-slate-700 dark:text-slate-300">
					A respite is a period of 24 hours or more spent in a safe location where heroes can rest and recuperate.
					During a respite, heroes regain recoveries, can convert victory points to experience, swap kits,
					and undertake downtime activities.
				</p>
			</section>

			<!-- Recoveries -->
			<section>
				<h4 class="text-base font-semibold text-slate-900 dark:text-white mb-2">Recoveries</h4>
				<p class="text-sm text-slate-700 dark:text-slate-300">
					During a respite, each hero regains all their recoveries (up to their maximum).
					This is the primary way heroes heal between encounters.
				</p>
			</section>

			<!-- Victory Points -->
			<section>
				<h4 class="text-base font-semibold text-slate-900 dark:text-white mb-2">Victory Points</h4>
				<p class="text-sm text-slate-700 dark:text-slate-300">
					Victory points (VP) earned during encounters can be converted to experience points (XP)
					during a respite. Each VP converts to XP on a 1:1 basis.
				</p>
			</section>

			<!-- Kit Swapping -->
			<section>
				<h4 class="text-base font-semibold text-slate-900 dark:text-white mb-2">Kit Swapping</h4>
				<p class="text-sm text-slate-700 dark:text-slate-300">
					Heroes can swap their kit during a respite. This allows them to change their
					combat loadout and abilities for upcoming challenges.
				</p>
			</section>

			<!-- Downtime Activities -->
			<section>
				<h4 class="text-base font-semibold text-slate-900 dark:text-white mb-2">Downtime Activities</h4>
				<div class="space-y-2 text-sm">
					<div class="flex gap-2 p-2 rounded bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
						<dt class="font-semibold text-blue-900 dark:text-blue-200 min-w-[7rem]">Project:</dt>
						<dd class="text-blue-800 dark:text-blue-300">Long-term undertaking progressed during downtime</dd>
					</div>
					<div class="flex gap-2 p-2 rounded bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800">
						<dt class="font-semibold text-orange-900 dark:text-orange-200 min-w-[7rem]">Crafting:</dt>
						<dd class="text-orange-800 dark:text-orange-300">Creating or improving items and equipment</dd>
					</div>
					<div class="flex gap-2 p-2 rounded bg-pink-50 dark:bg-pink-900/20 border border-pink-200 dark:border-pink-800">
						<dt class="font-semibold text-pink-900 dark:text-pink-200 min-w-[7rem]">Socializing:</dt>
						<dd class="text-pink-800 dark:text-pink-300">Building relationships and gathering information</dd>
					</div>
					<div class="flex gap-2 p-2 rounded bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800">
						<dt class="font-semibold text-purple-900 dark:text-purple-200 min-w-[7rem]">Training:</dt>
						<dd class="text-purple-800 dark:text-purple-300">Practicing skills and improving abilities</dd>
					</div>
					<div class="flex gap-2 p-2 rounded bg-cyan-50 dark:bg-cyan-900/20 border border-cyan-200 dark:border-cyan-800">
						<dt class="font-semibold text-cyan-900 dark:text-cyan-200 min-w-[7rem]">Investigation:</dt>
						<dd class="text-cyan-800 dark:text-cyan-300">Researching mysteries and uncovering secrets</dd>
					</div>
				</div>
			</section>
		</div>
	{/if}
</div>
