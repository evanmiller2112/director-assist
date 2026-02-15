<script lang="ts">
	import type { EntityTypeDefinition } from '$lib/types/entities';
	import type { PlayerExportFieldConfig } from '$lib/types/playerFieldVisibility';
	import {
		getCategoryVisibilitySetting,
		setCategoryVisibilitySetting
	} from '$lib/services/playerExportFieldConfigService';

	interface Props {
		entityTypes: EntityTypeDefinition[];
		config: PlayerExportFieldConfig;
		onConfigChange: (config: PlayerExportFieldConfig) => void;
	}

	let { entityTypes, config, onConfigChange }: Props = $props();

	function handleCategoryToggle(entityType: string, visible: boolean) {
		const newConfig = setCategoryVisibilitySetting(config, entityType, visible);
		onConfigChange(newConfig);
	}

	function getEffectiveVisibility(entityType: string): boolean {
		const setting = getCategoryVisibilitySetting(config, entityType);
		// If no config, default to visible (unless it's player_profile which is always hidden)
		if (setting !== undefined) {
			return setting;
		}
		return entityType !== 'player_profile';
	}

	function isHardcodedHidden(entityType: string): boolean {
		// player_profile is always hidden
		return entityType === 'player_profile';
	}
</script>

<div class="space-y-2">
	<div class="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
		Entity Category Visibility
	</div>
	<div class="text-xs text-slate-500 dark:text-slate-400 mb-4">
		Control which entire entity categories are included in player exports. Unchecked categories will be completely excluded.
	</div>

	<div class="space-y-1">
		{#each entityTypes as entityTypeDef}
			{@const isVisible = getEffectiveVisibility(entityTypeDef.type)}
			{@const isDisabled = isHardcodedHidden(entityTypeDef.type)}

			<label
				class="flex items-center gap-3 p-3 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors {isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}"
			>
				<!-- Checkbox -->
				<input
					type="checkbox"
					checked={isVisible}
					disabled={isDisabled}
					onchange={(e) => handleCategoryToggle(entityTypeDef.type, e.currentTarget.checked)}
					class="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500 flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
				/>

				<!-- Entity Type Icon -->
				<span class="flex-shrink-0 text-lg" aria-hidden="true">{entityTypeDef.icon}</span>

				<!-- Entity Type Label -->
				<span class="flex-1 text-sm text-slate-700 dark:text-slate-300 {!isVisible ? 'line-through opacity-60' : ''}">
					{entityTypeDef.label}
				</span>

				<!-- Hidden indicator for player_profile -->
				{#if isDisabled}
					<span class="flex-shrink-0 text-xs px-2 py-0.5 bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400 rounded">
						Always Hidden
					</span>
				{/if}
			</label>
		{/each}

		{#if entityTypes.length === 0}
			<p class="text-sm text-slate-500 dark:text-slate-400 italic py-2">
				No entity types available.
			</p>
		{/if}
	</div>
</div>
