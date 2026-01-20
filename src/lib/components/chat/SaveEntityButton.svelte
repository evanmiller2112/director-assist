<script lang="ts">
	import type { ParsedEntity } from '$lib/services/entityParserService';
	import type { BaseEntity } from '$lib/types';
	import type { SaveEntityResult } from '$lib/services/entitySaveService';
	import { getIconComponent } from '$lib/utils/icons';
	import { getEntityTypeDefinition } from '$lib/config/entityTypes';

	interface Props {
		entity: ParsedEntity;
		onSave: (entity: ParsedEntity) => Promise<SaveEntityResult>;
		onSaved?: (entity: BaseEntity) => void;
	}

	let { entity, onSave, onSaved }: Props = $props();

	let isSaving = $state(false);
	let error = $state<string | null>(null);

	// Check if entity has validation errors
	const hasValidationErrors = $derived(
		entity.validationErrors && Object.keys(entity.validationErrors).length > 0
	);

	// Get entity type definition for icon
	const typeDef = $derived(getEntityTypeDefinition(entity.entityType));
	const IconComponent = $derived(getIconComponent(typeDef?.icon ?? 'circle'));

	async function handleSave() {
		// Prevent multiple simultaneous saves
		if (isSaving) return;

		isSaving = true;
		error = null;

		try {
			const result = await onSave(entity);

			if (result.success && result.entity) {
				// Call onSaved callback if provided
				if (onSaved) {
					onSaved(result.entity);
				}
			} else {
				// Set error if save failed
				error = result.error || 'Failed to save entity';
			}
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to save entity';
		} finally {
			isSaving = false;
		}
	}

	// Tooltip message when disabled
	const disabledTooltip = $derived(
		hasValidationErrors ? 'This entity has validation errors and cannot be saved' : ''
	);
</script>

<div class="flex items-center gap-2">
	<button
		type="button"
		onclick={handleSave}
		disabled={hasValidationErrors || isSaving}
		title={disabledTooltip}
		class="flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg border transition-colors
			{hasValidationErrors || isSaving
			? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 border-slate-200 dark:border-slate-700 cursor-not-allowed'
			: 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700'}"
	>
		{#if isSaving}
			<div role="status" aria-live="polite" class="flex items-center gap-2">
				<svg
					class="animate-spin w-4 h-4"
					xmlns="http://www.w3.org/2000/svg"
					fill="none"
					viewBox="0 0 24 24"
				>
					<circle
						class="opacity-25"
						cx="12"
						cy="12"
						r="10"
						stroke="currentColor"
						stroke-width="4"
					></circle>
					<path
						class="opacity-75"
						fill="currentColor"
						d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
					></path>
				</svg>
				<span>Saving...</span>
			</div>
		{:else}
			<IconComponent class="w-4 h-4" />
			<span class="font-medium">{entity.name || 'Unnamed'}</span>
			<span class="text-xs">Save</span>
		{/if}
	</button>

	{#if error}
		<span class="text-xs text-red-600 dark:text-red-400">Error: {error}</span>
	{/if}
</div>
