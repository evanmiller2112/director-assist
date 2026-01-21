<script lang="ts">
	import { FileQuestion, Copy } from 'lucide-svelte';
	import { DRAW_STEEL_ENTITY_TEMPLATES, type EntityTypeTemplate } from '$lib/config/drawSteelEntityTemplates';
	import type { EntityTypeDefinition } from '$lib/types';
	import { getIconComponent } from '$lib/utils/icons';

	interface Props {
		onSelectTemplate: (template: EntityTypeDefinition) => void;
		onStartFromScratch: () => void;
		onCloneExisting?: () => void;
	}

	let { onSelectTemplate, onStartFromScratch, onCloneExisting }: Props = $props();

	function handleTemplateClick(template: EntityTypeTemplate) {
		onSelectTemplate(template.template);
	}

	// Get color classes for template cards
	function getColorClasses(color: string): string {
		const colorMap: Record<string, string> = {
			red: 'bg-red-50 border-red-200 hover:border-red-300 dark:bg-red-900/10 dark:border-red-800 dark:hover:border-red-700',
			yellow: 'bg-yellow-50 border-yellow-200 hover:border-yellow-300 dark:bg-yellow-900/10 dark:border-yellow-800 dark:hover:border-yellow-700',
			orange: 'bg-orange-50 border-orange-200 hover:border-orange-300 dark:bg-orange-900/10 dark:border-orange-800 dark:hover:border-orange-700',
			purple: 'bg-purple-50 border-purple-200 hover:border-purple-300 dark:bg-purple-900/10 dark:border-purple-800 dark:hover:border-purple-700',
			blue: 'bg-blue-50 border-blue-200 hover:border-blue-300 dark:bg-blue-900/10 dark:border-blue-800 dark:hover:border-blue-700'
		};
		return colorMap[color] || 'bg-slate-50 border-slate-200 hover:border-slate-300 dark:bg-slate-800 dark:border-slate-700 dark:hover:border-slate-600';
	}

	// Get icon color classes
	function getIconColorClasses(color: string): string {
		const colorMap: Record<string, string> = {
			red: 'text-red-600 dark:text-red-400',
			yellow: 'text-yellow-600 dark:text-yellow-400',
			orange: 'text-orange-600 dark:text-orange-400',
			purple: 'text-purple-600 dark:text-purple-400',
			blue: 'text-blue-600 dark:text-blue-400'
		};
		return colorMap[color] || 'text-slate-600 dark:text-slate-400';
	}
</script>

<div class="space-y-6">
	<div>
		<h2 class="text-lg font-semibold text-slate-900 dark:text-white mb-2">Choose a Template</h2>
		<p class="text-sm text-slate-600 dark:text-slate-400">
			Start with a pre-configured template for common Draw Steel mechanics, or create your own from scratch.
		</p>
	</div>

	<!-- Templates Grid -->
	<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
		<!-- Clone Existing Type Option -->
		{#if onCloneExisting}
			<button
				type="button"
				class="template-card text-left border-2 rounded-lg p-4 transition-all duration-200 border-blue-200 hover:border-blue-300 bg-blue-50 dark:bg-blue-900/10 dark:border-blue-800 dark:hover:border-blue-700"
				onclick={onCloneExisting}
				onkeydown={(e) => {
					if (e.key === 'Enter' || e.key === ' ') {
						e.preventDefault();
						onCloneExisting?.();
					}
				}}
				aria-label="Clone an existing entity type"
			>
				<div class="flex items-start gap-3">
					<div class="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-lg bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400">
						<Copy class="w-6 h-6" />
					</div>
					<div class="flex-1 min-w-0">
						<h3 class="font-semibold text-slate-900 dark:text-white mb-1">
							Clone Existing Type
						</h3>
						<p class="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
							Start with an existing entity type as a template and customize it.
						</p>
					</div>
				</div>
			</button>
		{/if}

		{#each DRAW_STEEL_ENTITY_TEMPLATES as template}
			{@const Icon = getIconComponent(template.template.icon)}
			<button
				type="button"
				class="template-card text-left border-2 rounded-lg p-4 transition-all duration-200 {getColorClasses(template.template.color)}"
				onclick={() => handleTemplateClick(template)}
				onkeydown={(e) => {
					if (e.key === 'Enter' || e.key === ' ') {
						e.preventDefault();
						handleTemplateClick(template);
					}
				}}
				aria-label="Use {template.name} template"
			>
				<div class="flex items-start gap-3">
					<div class="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-lg bg-white dark:bg-slate-800 {getIconColorClasses(template.template.color)}">
						<Icon class="w-6 h-6" />
					</div>
					<div class="flex-1 min-w-0">
						<h3 class="font-semibold text-slate-900 dark:text-white mb-1">
							{template.name}
						</h3>
						<p class="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
							{template.description}
						</p>
						<div class="mt-2 text-xs text-slate-500 dark:text-slate-500">
							{template.template.fieldDefinitions.length} fields
						</div>
					</div>
				</div>
			</button>
		{/each}
	</div>

	<!-- Start from Scratch Option -->
	<div class="pt-4 border-t border-slate-200 dark:border-slate-700">
		<button
			type="button"
			class="w-full text-left border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-4 hover:border-slate-400 dark:hover:border-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all duration-200"
			onclick={onStartFromScratch}
			onkeydown={(e) => {
				if (e.key === 'Enter' || e.key === ' ') {
					e.preventDefault();
					onStartFromScratch();
				}
			}}
			aria-label="Start from scratch without a template"
		>
			<div class="flex items-center gap-3">
				<div class="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
					<FileQuestion class="w-6 h-6" />
				</div>
				<div class="flex-1">
					<h3 class="font-semibold text-slate-900 dark:text-white mb-1">
						Start from Scratch
					</h3>
					<p class="text-sm text-slate-600 dark:text-slate-400">
						Create a completely custom entity type with your own fields and settings.
					</p>
				</div>
			</div>
		</button>
	</div>
</div>
