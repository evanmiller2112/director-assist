<script lang="ts">
	import { getGenerationTypeConfig } from '$lib/config/generationTypes';
	import type { GenerationType } from '$lib/types';

	interface Props {
		generationType: GenerationType;
		values: Record<string, string>;
		onchange: (key: string, value: string) => void;
		disabled?: boolean;
	}

	let { generationType, values, onchange, disabled = false }: Props = $props();

	// Get the current type config and its typeFields
	const config = $derived(getGenerationTypeConfig(generationType));
	const typeFields = $derived(config?.typeFields ?? []);

	// Get descriptions for currently selected values
	function getSelectedDescription(fieldKey: string): string | null {
		const field = typeFields.find(f => f.key === fieldKey);
		if (!field) return null;
		const selectedValue = values[fieldKey];
		if (!selectedValue) return null;
		const option = field.options.find(o => o.value === selectedValue);
		return option?.description ?? null;
	}

	const threatDescription = $derived(getSelectedDescription('threatLevel'));
	const roleDescription = $derived(getSelectedDescription('combatRole'));
</script>

{#if typeFields.length > 0}
	<div class="border-b border-slate-200 dark:border-slate-700 px-4 py-2">
		<div class="space-y-2">
			{#each typeFields as field (field.key)}
				<div class="flex items-center gap-2">
					<label
						for="type-field-{field.key}"
						class="text-xs text-slate-500 dark:text-slate-400 min-w-20 flex-shrink-0"
					>
						{field.label}
					</label>
					<select
						id="type-field-{field.key}"
						value={values[field.key] ?? field.defaultValue ?? ''}
						onchange={(e) => onchange(field.key, e.currentTarget.value)}
						{disabled}
						class="flex-1 text-xs rounded border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white py-1 px-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
					>
						{#each field.options as option (option.value)}
							<option value={option.value} title={option.description || ''}>
								{option.label}
							</option>
						{/each}
					</select>
				</div>
			{/each}
		</div>
		<!-- Help text showing current selection descriptions -->
		{#if threatDescription || roleDescription}
			<div class="mt-2 text-xs text-slate-500 dark:text-slate-400 space-y-0.5">
				{#if threatDescription}
					<p>{threatDescription}</p>
				{/if}
				{#if roleDescription}
					<p>{roleDescription}</p>
				{/if}
			</div>
		{/if}
	</div>
{/if}
