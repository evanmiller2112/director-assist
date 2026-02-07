<!--
  @component GenerateSuggestionsButton

  A button that triggers AI suggestion generation for empty fields in entity forms.
  Only enabled when there are empty fields that can be filled with suggestions.

  @prop {string} entityType - The type of entity being edited
  @prop {object} currentData - Current field values for the entity
  @prop {number} [entityId] - Optional entity ID if editing existing entity
  @prop {Function} [onSuggestionsGenerated] - Callback when suggestions are generated
  @prop {boolean} [disabled] - External disabled state

  @example
  ```svelte
  <GenerateSuggestionsButton
    entityType="character"
    currentData={formData}
    entityId={123}
    onSuggestionsGenerated={() => refreshSuggestions()}
  />
  ```
-->
<script lang="ts">
	import { Lightbulb, Loader2 } from 'lucide-svelte';
	import { notificationStore } from '$lib/stores/notifications.svelte';
	import { tick } from 'svelte';

	interface Props {
		entityType: string;
		currentData: Record<string, any>;
		entityId?: number;
		onSuggestionsGenerated?: () => void;
		disabled?: boolean;
	}

	let {
		entityType,
		currentData,
		entityId,
		onSuggestionsGenerated,
		disabled = false
	}: Props = $props();

	let isGenerating = $state(false);

	// Check if there are empty fields that can be filled
	const hasEmptyFields = $derived(() => {
		if (!currentData || typeof currentData !== 'object') {
			return true; // Allow generation if data is invalid/empty
		}

		const keys = Object.keys(currentData);

		// Empty object - allow generation
		if (keys.length === 0) {
			return true;
		}

		// Check if any existing values are empty
		const hasExplicitlyEmptyFields = Object.values(currentData).some((value) => {
			return value === '' || value === null || value === undefined;
		});

		if (hasExplicitlyEmptyFields) {
			return true;
		}

		// If object has only a few fields (< 3), assume there might be more fields to generate
		// This handles cases like { name: 'Aragorn' } where description, tactics, etc. could be generated
		if (keys.length < 3) {
			return true;
		}

		// Otherwise, assume the entity is mostly complete
		return false;
	});

	const isDisabled = $derived(disabled || isGenerating || !hasEmptyFields());

	async function handleGenerate() {
		if (isDisabled) return;

		isGenerating = true;

		// Wait for Svelte to flush reactive updates (ensures loading state is visible)
		await tick();

		try {
			// Call the callback to trigger generation - wrap in Promise.resolve to handle both sync and async
			if (onSuggestionsGenerated) {
				await Promise.resolve(onSuggestionsGenerated());
			}

			// Show success feedback
			const emptyFieldCount = Object.values(currentData || {}).filter(
				(v) => v === '' || v === null || v === undefined
			).length;

			if (emptyFieldCount > 0) {
				notificationStore.success(
					`Generated ${emptyFieldCount} ${emptyFieldCount === 1 ? 'suggestion' : 'suggestions'}`
				);
			}
		} catch (error) {
			console.error('Error generating suggestions:', error);

			// Show user-friendly error message
			const errorMessage =
				error instanceof Error ? error.message : 'Failed to generate suggestions';

			if (errorMessage.includes('API key')) {
				notificationStore.error('Please configure your API key in Settings');
			} else if (errorMessage.includes('timeout')) {
				notificationStore.error('Request timed out. Please try again.');
			} else if (errorMessage.includes('Network')) {
				notificationStore.error('Network error. Please check your connection.');
			} else {
				notificationStore.error('Failed to generate suggestions. Please try again.');
			}
		} finally {
			isGenerating = false;
		}
	}

	function handleKeyDown(event: KeyboardEvent) {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			handleGenerate();
		}
	}

	// Determine tooltip text based on state
	const tooltipText = $derived(() => {
		if (!hasEmptyFields()) {
			return 'All fields are filled';
		}
		return 'Generate AI suggestions for empty fields';
	});
</script>

<button
	type="button"
	onclick={handleGenerate}
	onkeydown={handleKeyDown}
	disabled={isDisabled}
	aria-busy={isGenerating}
	aria-label={tooltipText()}
	title={tooltipText()}
	class="inline-flex items-center gap-2 rounded-lg border border-transparent bg-purple-600 hover:bg-purple-700 px-4 py-2 text-base font-medium text-white hover:shadow-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
>
	{#if isGenerating}
		<Loader2 class="h-5 w-5 animate-spin" />
		<span>Generating...</span>
	{:else}
		<Lightbulb class="h-5 w-5" />
		<span>Suggest Content</span>
	{/if}
</button>
