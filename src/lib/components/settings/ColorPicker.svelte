<script lang="ts">
	interface Props {
		value: string;
		onchange?: (color: string) => void;
	}

	let { value = $bindable(), onchange }: Props = $props();

	let isOpen = $state(false);

	// Available colors for entity types (matches tailwind.config.ts)
	const COLORS: Record<string, { name: string; hex: string }> = {
		character: { name: 'Blue', hex: '#3b82f6' },
		npc: { name: 'Green', hex: '#22c55e' },
		location: { name: 'Amber', hex: '#f59e0b' },
		faction: { name: 'Purple', hex: '#a855f7' },
		item: { name: 'Orange', hex: '#f97316' },
		encounter: { name: 'Red', hex: '#ef4444' },
		session: { name: 'Cyan', hex: '#06b6d4' },
		deity: { name: 'Yellow', hex: '#eab308' },
		timeline: { name: 'Slate', hex: '#64748b' },
		rule: { name: 'Indigo', hex: '#6366f1' },
		player: { name: 'Pink', hex: '#ec4899' },
		// Additional colors
		teal: { name: 'Teal', hex: '#14b8a6' },
		emerald: { name: 'Emerald', hex: '#10b981' },
		rose: { name: 'Rose', hex: '#f43f5e' },
		violet: { name: 'Violet', hex: '#8b5cf6' },
		sky: { name: 'Sky', hex: '#0ea5e9' },
		lime: { name: 'Lime', hex: '#84cc16' }
	};

	function selectColor(colorKey: string) {
		value = colorKey;
		onchange?.(colorKey);
		isOpen = false;
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			isOpen = false;
		}
	}

	const currentColor = $derived(COLORS[value] ?? { name: value, hex: '#64748b' });
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="relative">
	<button
		type="button"
		class="input flex items-center gap-2 cursor-pointer w-full"
		onclick={() => (isOpen = !isOpen)}
	>
		<span
			class="w-5 h-5 rounded-full border border-slate-300 dark:border-slate-600"
			style="background-color: {currentColor.hex}"
		></span>
		<span class="flex-1 text-left">{currentColor.name}</span>
		<svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
		</svg>
	</button>

	{#if isOpen}
		<!-- Backdrop -->
		<button
			type="button"
			class="fixed inset-0 z-40"
			onclick={() => (isOpen = false)}
			aria-label="Close picker"
		></button>

		<!-- Dropdown -->
		<div
			class="absolute z-50 mt-1 w-full bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 p-3"
		>
			<div class="grid grid-cols-6 gap-2">
				{#each Object.entries(COLORS) as [colorKey, colorInfo]}
					<button
						type="button"
						class="w-8 h-8 rounded-full border-2 transition-all hover:scale-110
							{value === colorKey
							? 'border-slate-900 dark:border-white ring-2 ring-offset-2 ring-blue-500'
							: 'border-transparent hover:border-slate-300 dark:hover:border-slate-500'}"
						style="background-color: {colorInfo.hex}"
						onclick={() => selectColor(colorKey)}
						title={colorInfo.name}
					></button>
				{/each}
			</div>
		</div>
	{/if}
</div>
