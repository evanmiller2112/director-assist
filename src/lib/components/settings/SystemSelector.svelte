<script lang="ts">
	import { getAllSystemProfiles } from '$lib/config/systems';
	import type { SystemProfile } from '$lib/types/systems';

	interface Props {
		value?: string;
		onchange?: (systemId: string) => void;
		disabled?: boolean;
		showDescription?: boolean;
	}

	let {
		value = $bindable('draw-steel'),
		onchange,
		disabled = false,
		showDescription = false
	}: Props = $props();

	// Get all available system profiles
	const systems = $derived(getAllSystemProfiles());

	// Find currently selected system
	const selectedSystem = $derived(
		systems.find((s) => s.id === (value || 'draw-steel')) ?? systems[0]
	);

	function handleChange(event: Event) {
		const target = event.target as HTMLSelectElement;
		const newValue = target.value;
		value = newValue;
		onchange?.(newValue);
	}
</script>

<div class="space-y-2">
	<label for="system-selector" class="label">Game System</label>
	<select
		id="system-selector"
		class="input w-full"
		value={value || 'draw-steel'}
		onchange={handleChange}
		disabled={disabled}
		aria-label="Game System"
	>
		{#each systems as system}
			<option value={system.id}>{system.name}</option>
		{/each}
	</select>

	{#if showDescription && selectedSystem?.description}
		<p class="text-sm text-slate-600 dark:text-slate-400">
			{selectedSystem.description}
		</p>
	{/if}
</div>
