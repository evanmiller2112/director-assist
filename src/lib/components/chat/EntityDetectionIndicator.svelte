<script lang="ts">
	import type { ParsedEntity } from '$lib/services/entityParserService';
	import type { BaseEntity } from '$lib/types';
	import SaveEntityButton from './SaveEntityButton.svelte';
	import ReviewEditButton from './ReviewEditButton.svelte';
	import { saveEntityFromParsed } from '$lib/services/entitySaveService';
	import { getIconComponent } from '$lib/utils/icons';
	import { getEntityTypeDefinition } from '$lib/config/entityTypes';
	import { Check } from 'lucide-svelte';

	interface Props {
		entities: ParsedEntity[];
		onEntitySaved?: (entity: BaseEntity) => void;
		savedEntityIds?: string[];
		messageId?: string;
	}

	let { entities, onEntitySaved, savedEntityIds = [], messageId }: Props = $props();

	// Determine if entity is already saved by checking savedEntityIds
	function isEntitySaved(entity: ParsedEntity, index: number): boolean {
		// Use index-based tracking since ParsedEntity doesn't persist saved state
		return savedEntityIds.length > index && savedEntityIds[index] !== undefined;
	}

	// Get confidence level class
	function getConfidenceClass(confidence: number): string {
		if (confidence >= 0.8) {
			return 'text-green-600 dark:text-green-400';
		} else if (confidence >= 0.6) {
			return 'text-yellow-600 dark:text-yellow-400';
		} else {
			return 'text-orange-600 dark:text-orange-400';
		}
	}

	// Handle entity save
	async function handleEntitySave(entity: ParsedEntity) {
		return await saveEntityFromParsed(entity);
	}

	// Handle successful save callback
	function handleEntitySaved(entity: BaseEntity) {
		if (onEntitySaved) {
			onEntitySaved(entity);
		}
	}
</script>

{#if entities && entities.length > 0}
	<div class="mt-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
		<!-- Entity count badge -->
		<div class="flex items-center gap-2 mb-2">
			<span class="text-sm font-medium text-slate-700 dark:text-slate-300">
				{entities.length} {entities.length === 1 ? 'entity' : 'entities'} detected
			</span>
		</div>

		<!-- Entity list -->
		<div class="space-y-2">
			{#each entities as entity, index}
				{@const typeDef = getEntityTypeDefinition(entity.entityType)}
				{@const IconComponent = getIconComponent(typeDef?.icon ?? 'circle')}
				{@const isSaved = isEntitySaved(entity, index)}
				{@const confidencePercent = Math.round(entity.confidence * 100)}

				<div class="flex items-center gap-3 p-2 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-700">
					<!-- Confidence indicator -->
					<div class="flex-shrink-0">
						<span class="text-xs font-medium {getConfidenceClass(entity.confidence)}">
							{confidencePercent}%
						</span>
					</div>

					<!-- Entity info and action buttons -->
					<div class="flex-1 flex items-center gap-2">
						{#if isSaved}
							<div class="flex items-center gap-2 flex-1">
								<IconComponent class="w-4 h-4 text-{typeDef?.color ?? 'slate'}-500" />
								<span class="text-sm font-medium text-slate-900 dark:text-white">{entity.name}</span>
								<div class="flex items-center gap-1 text-green-600 dark:text-green-400 text-sm ml-auto">
									<Check class="w-4 h-4" />
									<span>Saved</span>
								</div>
							</div>
						{:else}
							<SaveEntityButton
								{entity}
								onSave={handleEntitySave}
								onSaved={handleEntitySaved}
							/>
						{/if}

						<!-- Review & Edit button (always shown) -->
						<ReviewEditButton {entity} {messageId} />
					</div>
				</div>
			{/each}
		</div>
	</div>
{/if}
