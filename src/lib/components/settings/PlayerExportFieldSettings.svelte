<script lang="ts">
	import { ChevronDown, ChevronRight, Lock, Info, RotateCcw } from 'lucide-svelte';
	import type { EntityTypeDefinition } from '$lib/types/entities';
	import type { PlayerExportFieldConfig } from '$lib/types/playerFieldVisibility';
	import {
		getFieldVisibilitySetting,
		setFieldVisibilitySetting,
		removeFieldVisibilitySetting,
		resetEntityTypeConfig,
		getHardcodedDefault
	} from '$lib/services/playerExportFieldConfigService';

	interface Props {
		entityTypes: EntityTypeDefinition[];
		config: PlayerExportFieldConfig;
		onConfigChange: (config: PlayerExportFieldConfig) => void;
	}

	let { entityTypes, config, onConfigChange }: Props = $props();

	// Track which accordion sections are expanded
	let expandedSections = $state<Record<string, boolean>>({});

	function toggleSection(entityType: string) {
		expandedSections = {
			...expandedSections,
			[entityType]: !expandedSections[entityType]
		};
	}

	function handleFieldToggle(entityType: string, fieldKey: string, visible: boolean) {
		const newConfig = setFieldVisibilitySetting(config, entityType, fieldKey, visible);
		onConfigChange(newConfig);
	}

	function handleResetEntityType(entityType: string) {
		const newConfig = resetEntityTypeConfig(config, entityType);
		onConfigChange(newConfig);
	}

	function getEffectiveVisibility(entityType: string, fieldKey: string, fieldDef: import('$lib/types/entities').FieldDefinition): boolean {
		const setting = getFieldVisibilitySetting(config, entityType, fieldKey);
		if (setting !== undefined) {
			return setting;
		}
		return getHardcodedDefault(fieldKey, fieldDef, entityType);
	}

	function hasCustomConfig(entityType: string): boolean {
		const entityConfig = config.fieldVisibility[entityType];
		return !!entityConfig && Object.keys(entityConfig).length > 0;
	}

	function getFieldTypeBadgeColor(fieldType: string): string {
		switch (fieldType) {
			case 'text':
			case 'textarea':
			case 'richtext':
				return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
			case 'number':
				return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300';
			case 'boolean':
				return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300';
			case 'select':
			case 'multi-select':
				return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300';
			case 'tags':
				return 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300';
			case 'entity-ref':
			case 'entity-refs':
				return 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300';
			case 'date':
				return 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300';
			case 'url':
			case 'image':
				return 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300';
			case 'computed':
				return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300';
			case 'dice':
				return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300';
			case 'resource':
				return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300';
			case 'duration':
				return 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300';
			default:
				return 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300';
		}
	}
</script>

<div class="space-y-3">
	{#each entityTypes as entityTypeDef}
		{@const isExpanded = expandedSections[entityTypeDef.type] ?? false}
		{@const hasConfig = hasCustomConfig(entityTypeDef.type)}

		<div class="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
			<!-- Accordion Header -->
			<button
				type="button"
				class="w-full flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-left"
				onclick={() => toggleSection(entityTypeDef.type)}
				aria-expanded={isExpanded}
				aria-controls="section-{entityTypeDef.type}"
			>
				<!-- Expand/Collapse Icon -->
				<span class="flex-shrink-0 text-slate-400">
					{#if isExpanded}
						<ChevronDown class="w-4 h-4" />
					{:else}
						<ChevronRight class="w-4 h-4" />
					{/if}
				</span>

				<!-- Entity Type Icon + Label -->
				<span class="flex-shrink-0 text-lg" aria-hidden="true">{entityTypeDef.icon}</span>
				<span class="flex-1 font-medium text-slate-900 dark:text-white">
					{entityTypeDef.label}
				</span>

				<!-- Custom config indicator -->
				{#if hasConfig}
					<span class="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 rounded-full">
						Customized
					</span>
				{/if}

				<!-- Field count -->
				<span class="text-xs text-slate-500 dark:text-slate-400">
					{entityTypeDef.fieldDefinitions.length} field{entityTypeDef.fieldDefinitions.length !== 1 ? 's' : ''}
				</span>
			</button>

			<!-- Accordion Content -->
			{#if isExpanded}
				<div
					id="section-{entityTypeDef.type}"
					class="border-t border-slate-200 dark:border-slate-700"
				>
					<!-- Reset Button -->
					{#if hasConfig}
						<div class="px-4 pt-3 pb-1 flex justify-end">
							<button
								type="button"
								class="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
								onclick={() => handleResetEntityType(entityTypeDef.type)}
								title="Reset all fields to default visibility"
							>
								<RotateCcw class="w-3 h-3" />
								Reset to Defaults
							</button>
						</div>
					{/if}

					<!-- Field List -->
					<div class="px-4 pb-4 {hasConfig ? 'pt-1' : 'pt-3'} space-y-1">
						{#each entityTypeDef.fieldDefinitions as fieldDef}
							{@const isVisible = getEffectiveVisibility(entityTypeDef.type, fieldDef.key, fieldDef)}
							{@const isSecretField = fieldDef.section === 'hidden'}
							{@const isNotesField = fieldDef.key === 'notes'}

							<label
								class="flex items-center gap-3 p-2 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
							>
								<!-- Checkbox -->
								<input
									type="checkbox"
									checked={isVisible}
									onchange={(e) => handleFieldToggle(entityTypeDef.type, fieldDef.key, e.currentTarget.checked)}
									class="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500 flex-shrink-0"
								/>

								<!-- Field Label -->
								<span class="flex-1 text-sm text-slate-700 dark:text-slate-300 {!isVisible ? 'line-through opacity-60' : ''}">
									{fieldDef.label}
								</span>

								<!-- Field Type Badge -->
								<span class="flex-shrink-0 text-xs px-1.5 py-0.5 rounded {getFieldTypeBadgeColor(fieldDef.type)}">
									{fieldDef.type}
								</span>

								<!-- Secret Field Indicator -->
								{#if isSecretField}
									<span class="flex-shrink-0" title="Secret field - hidden by default">
										<Lock class="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
									</span>
								{/if}

								<!-- Notes Field Indicator -->
								{#if isNotesField}
									<span class="flex-shrink-0" title="DM notes - always hidden by default">
										<Info class="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
									</span>
								{/if}
							</label>
						{/each}

						{#if entityTypeDef.fieldDefinitions.length === 0}
							<p class="text-sm text-slate-500 dark:text-slate-400 italic py-2">
								No fields defined for this entity type.
							</p>
						{/if}
					</div>
				</div>
			{/if}
		</div>
	{/each}

	{#if entityTypes.length === 0}
		<p class="text-sm text-slate-500 dark:text-slate-400 italic py-4 text-center">
			No entity types available.
		</p>
	{/if}
</div>
