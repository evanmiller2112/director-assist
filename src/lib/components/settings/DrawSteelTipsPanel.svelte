<script lang="ts">
	import { X, ChevronDown, ChevronUp, Lightbulb, FileType, Hash, ListCheck, Link, Wrench } from 'lucide-svelte';

	interface Props {
		dismissed?: boolean;
		onDismiss?: () => void;
	}

	let { dismissed = false, onDismiss }: Props = $props();

	let fieldTypesExpanded = $state(true);
	let examplesExpanded = $state(true);

	function handleDismiss() {
		onDismiss?.();
	}

	function toggleFieldTypes() {
		fieldTypesExpanded = !fieldTypesExpanded;
	}

	function toggleExamples() {
		examplesExpanded = !examplesExpanded;
	}
</script>

{#if !dismissed}
	<div
		role="region"
		aria-label="Tips for Draw Steel campaigns"
		data-testid="tips-panel"
		class="mb-6 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg overflow-hidden"
	>
		<!-- Header -->
		<div class="flex items-start gap-3 p-4 border-b border-amber-200 dark:border-amber-800">
			<div class="flex-shrink-0 w-10 h-10 bg-amber-100 dark:bg-amber-900/40 rounded-lg flex items-center justify-center">
				<Lightbulb class="w-5 h-5 text-amber-600 dark:text-amber-400" />
			</div>
			<div class="flex-1">
				<h3 class="text-base font-semibold text-amber-900 dark:text-amber-100">
					Tips for Draw Steel Custom Entities
				</h3>
			</div>
			<button
				type="button"
				class="flex-shrink-0 text-amber-600 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-200 focus:outline-none focus:ring-2 focus:ring-amber-500 rounded p-1"
				onclick={handleDismiss}
				aria-label="Dismiss tips panel"
			>
				<X class="w-5 h-5" />
			</button>
		</div>

		<!-- Content -->
		<div class="p-4 space-y-4">
			<!-- Field Types Section -->
			<div>
				<button
					type="button"
					class="flex items-center gap-2 w-full text-left mb-2"
					onclick={toggleFieldTypes}
					aria-expanded={fieldTypesExpanded}
				>
					<h3 class="text-sm font-medium text-amber-900 dark:text-amber-100">Field Types</h3>
					{#if fieldTypesExpanded}
						<ChevronUp class="w-4 h-4 text-amber-600 dark:text-amber-400" />
					{:else}
						<ChevronDown class="w-4 h-4 text-amber-600 dark:text-amber-400" />
					{/if}
				</button>

				{#if fieldTypesExpanded}
					<div class="space-y-2 text-sm text-amber-900 dark:text-amber-100">
						<div class="flex items-start gap-2">
							<FileType class="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
							<div>
								Text - Often used for names, descriptions, and titles
							</div>
						</div>
						<div class="flex items-start gap-2">
							<Hash class="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
							<div>
								Number - Perfect for AC, HP, damage bonuses, and other stats
							</div>
						</div>
						<div class="flex items-start gap-2">
							<ListCheck class="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
							<div>
								Select - Great for threat_level, role, school of magic, etc.
							</div>
						</div>
						<div class="flex items-start gap-2">
							<Wrench class="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
							<div>
								Computed - For calculated values like total_hp = level * 3 + con
							</div>
						</div>
						<div class="flex items-start gap-2">
							<Link class="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
							<div>
								Entity-ref - Use to link to other entities in your campaign
							</div>
						</div>
					</div>
				{/if}
			</div>

			<!-- Examples Section -->
			<div>
				<button
					type="button"
					class="flex items-center gap-2 w-full text-left mb-2"
					onclick={toggleExamples}
					aria-expanded={examplesExpanded}
				>
					<h3 class="text-sm font-medium text-amber-900 dark:text-amber-100">Examples</h3>
					{#if examplesExpanded}
						<ChevronUp class="w-4 h-4 text-amber-600 dark:text-amber-400" />
					{:else}
						<ChevronDown class="w-4 h-4 text-amber-600 dark:text-amber-400" />
					{/if}
				</button>

				{#if examplesExpanded}
					<div class="space-y-2 text-sm text-amber-900 dark:text-amber-100">
						<div>
							<strong>Monster</strong> - Creatures with threat_level, role, HP, AC
						</div>
						<div>
							<strong>Ability</strong> - Powers and features with type, usage, keywords
						</div>
						<div>
							<strong>Condition</strong> - Status effects with duration, severity
						</div>
						<div class="pt-2 mt-2 border-t border-amber-200 dark:border-amber-700">
							<strong>Naming tip:</strong> Use snake_case (lowercase with underscores) for field names
						</div>
					</div>
				{/if}
			</div>
		</div>
	</div>
{/if}
