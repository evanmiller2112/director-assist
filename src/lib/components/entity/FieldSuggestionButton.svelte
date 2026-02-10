<!--
  @component FieldSuggestionButton

  A button component for triggering AI suggestion generation for a single field.
  Appears inline with field labels when AI is in "suggestions" mode.
  Similar to FieldGenerateButton but for the suggestions workflow.

  @prop {string} fieldKey - The key of the field to generate suggestions for
  @prop {FieldDefinition} fieldDefinition - The field definition object
  @prop {EntityType} entityType - The type of entity (e.g., 'npc', 'location')
  @prop {object} entityData - The current entity data
  @prop {Function} onSuggestionGenerated - Callback when suggestion is generated
  @prop {boolean} [disabled=false] - Whether the button is disabled

  @example
  ```svelte
  <FieldSuggestionButton
    fieldKey="personality"
    fieldDefinition={fieldDef}
    entityType="npc"
    entityData={npc}
    onSuggestionGenerated={handleSuggestion}
  />
  ```
-->
<script lang="ts">
	import { Lightbulb, Loader2 } from 'lucide-svelte';
	import { aiSettings } from '$lib/stores/aiSettings.svelte';
	import type { FieldDefinition, EntityType, FieldValue } from '$lib/types';

	interface Props {
		fieldKey: string;
		fieldDefinition: FieldDefinition;
		entityType: EntityType;
		entityData: {
			id: string;
			type: EntityType;
			name: string;
			description?: string;
			summary?: string;
			tags?: string[];
			notes?: string;
			fields: Record<string, FieldValue>;
			createdAt?: Date;
			updatedAt?: Date;
		};
		onSuggestionGenerated: (params: {
			fieldKey: string;
			fieldDefinition: FieldDefinition;
		}) => void | Promise<void>;
		disabled?: boolean;
	}

	let { fieldKey, fieldDefinition, entityType, entityData, onSuggestionGenerated, disabled = false }: Props = $props();

	let isGenerating = $state(false);

	// Only show when AI is enabled and field is generatable
	const shouldShow = $derived(
		aiSettings.isEnabled &&
		(fieldDefinition.aiGenerate !== false)
	);

	async function handleClick() {
		if (disabled || isGenerating) return;

		isGenerating = true;
		try {
			await onSuggestionGenerated({ fieldKey, fieldDefinition });
		} catch (error) {
			console.error('[FieldSuggestionButton] Error generating suggestion:', error);
		} finally {
			isGenerating = false;
		}
	}

	function handleKeyDown(event: KeyboardEvent) {
		// Native button behavior for Enter and Space
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			handleClick();
		}
	}
</script>

{#if shouldShow}
	<button
		type="button"
		onclick={handleClick}
		onkeydown={handleKeyDown}
		disabled={disabled || isGenerating}
		class="inline-flex items-center gap-1.5 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-2 py-1 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
		title="Generate AI suggestions for {fieldDefinition.label}"
	>
		{#if isGenerating}
			<Loader2 class="h-4 w-4 animate-spin" />
		{:else}
			<Lightbulb class="h-4 w-4" />
		{/if}
		<span class="hidden sm:inline">Suggest</span>
	</button>
{/if}
