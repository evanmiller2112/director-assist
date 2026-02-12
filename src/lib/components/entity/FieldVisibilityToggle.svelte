<!--
  @component FieldVisibilityToggle

  A small toggle button for controlling per-entity field visibility in player exports.
  Cycles through three states on click:
    1. Inherit (no override) - faded icon showing category default
    2. Explicitly included - solid green eye icon
    3. Explicitly excluded - solid red closed-eye icon

  Designed to appear next to field labels in the entity editor.

  @prop {string} fieldKey - The field key
  @prop {Record<string, unknown>} entityMetadata - The entity's metadata object
  @prop {boolean} categoryDefault - The category-level default visibility for this field
  @prop {(fieldKey: string, value: boolean | undefined) => void} onToggle - Callback when toggled

  @example
  ```svelte
  <FieldVisibilityToggle
    fieldKey="occupation"
    entityMetadata={entity.metadata}
    categoryDefault={true}
    onToggle={(key, value) => handleVisibilityChange(key, value)}
  />
  ```
-->
<script lang="ts">
	import { Eye, EyeOff } from 'lucide-svelte';
	import {
		getFieldOverrideState,
		cycleFieldOverrideState,
		getResolvedFieldVisibility
	} from '$lib/services/entityFieldVisibilityService';

	interface Props {
		fieldKey: string;
		entityMetadata: Record<string, unknown>;
		categoryDefault: boolean;
		onToggle: (fieldKey: string, value: boolean | undefined) => void;
	}

	let { fieldKey, entityMetadata, categoryDefault, onToggle }: Props = $props();

	const overrideState = $derived(getFieldOverrideState(entityMetadata, fieldKey));
	const resolved = $derived(getResolvedFieldVisibility(entityMetadata, fieldKey, categoryDefault));

	const tooltipText = $derived.by(() => {
		if (overrideState === true) {
			return 'Visible to players (overridden)';
		}
		if (overrideState === false) {
			return 'Hidden from players (overridden)';
		}
		// Inheriting
		if (categoryDefault) {
			return 'Visible to players (default)';
		}
		return 'Hidden from players (default)';
	});

	const ariaLabel = $derived.by(() => {
		return `${tooltipText} - Click to cycle visibility for ${fieldKey}`;
	});

	function handleClick() {
		const nextState = cycleFieldOverrideState(overrideState);
		onToggle(fieldKey, nextState);
	}
</script>

<button
	type="button"
	onclick={handleClick}
	title={tooltipText}
	aria-label={ariaLabel}
	class="inline-flex items-center justify-center rounded p-0.5 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1
		{overrideState === true
		? 'text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30'
		: overrideState === false
			? 'text-red-500 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30'
			: 'text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 opacity-60'}"
>
	{#if resolved.visible}
		<Eye class="h-3.5 w-3.5" />
	{:else}
		<EyeOff class="h-3.5 w-3.5" />
	{/if}
</button>
