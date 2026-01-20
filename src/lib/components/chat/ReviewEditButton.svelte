<script lang="ts">
	import type { ParsedEntity } from '$lib/services/entityParserService';
	import { goto } from '$app/navigation';
	import { Edit } from 'lucide-svelte';
	import { buildPrefillUrl } from '$lib/utils/entityPrefillUtils';

	interface Props {
		entity: ParsedEntity;
		messageId?: string;
	}

	let { entity, messageId }: Props = $props();

	// Check if entity has validation errors
	const hasValidationErrors = $derived(
		entity.validationErrors && Object.keys(entity.validationErrors).length > 0
	);

	// Tooltip message when disabled
	const disabledTooltip = $derived(
		hasValidationErrors ? 'This entity has validation errors and cannot be edited' : ''
	);

	function handleClick() {
		// Don't navigate if disabled
		if (hasValidationErrors) {
			return;
		}

		// Build URL with prefill data
		const url = buildPrefillUrl(entity, messageId);

		// Navigate to the prefilled form
		goto(url);
	}
</script>

<button
	type="button"
	onclick={handleClick}
	disabled={hasValidationErrors}
	title={disabledTooltip}
	class="flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg border transition-colors
		{hasValidationErrors
		? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 border-slate-200 dark:border-slate-700 cursor-not-allowed'
		: 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700'}"
>
	<Edit class="w-4 h-4" />
	<span>Review & Edit</span>
</button>
