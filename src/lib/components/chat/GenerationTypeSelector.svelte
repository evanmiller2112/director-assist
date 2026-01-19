<script lang="ts">
	import { GENERATION_TYPES } from '$lib/config/generationTypes';
	import type { GenerationType } from '$lib/types';
	import * as Icons from 'lucide-svelte';

	interface Props {
		value?: GenerationType;
		onchange?: (type: GenerationType) => void;
		disabled?: boolean;
		compact?: boolean;
		class?: string;
	}

	let {
		value = $bindable('custom'),
		onchange,
		disabled = false,
		compact = false,
		class: className = ''
	}: Props = $props();

	// Track if we're updating programmatically to avoid firing onchange
	let internalValue = $state(value);

	// Update internal value when prop changes
	$effect(() => {
		internalValue = value;
	});

	// Get the current type config
	const currentConfig = $derived(GENERATION_TYPES.find((config) => config.id === value));

	// Get the icon name
	const currentIcon = $derived(currentConfig?.icon || 'sparkles');

	function handleChange(event: Event) {
		if (disabled) return;

		const target = event.currentTarget as HTMLSelectElement;
		const newValue = target.value as GenerationType;
		internalValue = newValue;
		value = newValue;
		onchange?.(newValue);
	}
</script>

<div class="border-b border-slate-200 dark:border-slate-700 {className}">
	<div class="px-4 py-2 {compact ? 'py-1.5 compact' : ''}">
		<div class="flex items-center gap-2">
			<!-- Icon display -->
			<label
				for="generation-type-selector"
				class="flex-shrink-0 text-slate-400 dark:text-slate-500"
				aria-label="Generation type icon"
			>
				{#if currentIcon === 'sparkles'}
					<Icons.Sparkles class="w-4 h-4" />
				{:else if currentIcon === 'user'}
					<Icons.User class="w-4 h-4" />
				{:else if currentIcon === 'map-pin'}
					<Icons.MapPin class="w-4 h-4" />
				{:else if currentIcon === 'book'}
					<Icons.Book class="w-4 h-4" />
				{:else if currentIcon === 'swords'}
					<Icons.Swords class="w-4 h-4" />
				{:else if currentIcon === 'package'}
					<Icons.Package class="w-4 h-4" />
				{:else if currentIcon === 'users'}
					<Icons.Users class="w-4 h-4" />
				{:else if currentIcon === 'calendar'}
					<Icons.Calendar class="w-4 h-4" />
				{:else}
					<Icons.Sparkles class="w-4 h-4" />
				{/if}
			</label>

			<!-- Select dropdown -->
			<select
				bind:value={internalValue}
				onchange={handleChange}
				{disabled}
				name="generation-type"
				id="generation-type-selector"
				aria-label="Generation type"
				aria-describedby="generation-type-description"
				data-testid="generation-type-select"
				class="flex-1 text-sm rounded border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white {compact ? 'py-1 px-2' : 'py-1.5 px-2.5'} focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed {compact ? 'text-xs sm small compact' : ''}"
			>
				{#each GENERATION_TYPES as config (config.id)}
					<option value={config.id}>
						{config.label}
					</option>
				{/each}
			</select>
		</div>

		<!-- Description/help text -->
		{#if !compact && currentConfig}
			<p
				class="mt-1.5 text-xs text-slate-500 dark:text-slate-400 description help-text"
				data-description
				id="generation-type-description"
			>
				{currentConfig.description}
			</p>
		{/if}
	</div>
</div>
