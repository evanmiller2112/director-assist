<script lang="ts">
	import { ICON_CATEGORIES, getIconComponent, ICON_DISPLAY_NAMES } from '$lib/utils/icons';

	interface Props {
		value: string;
		onchange?: (icon: string) => void;
	}

	let { value = $bindable(), onchange }: Props = $props();

	let isOpen = $state(false);

	function selectIcon(iconName: string) {
		value = iconName;
		onchange?.(iconName);
		isOpen = false;
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			isOpen = false;
		}
	}

	const SelectedIcon = $derived(getIconComponent(value));
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="relative">
	<button
		type="button"
		class="input flex items-center gap-2 cursor-pointer w-full"
		onclick={() => (isOpen = !isOpen)}
	>
		<SelectedIcon class="w-5 h-5" />
		<span class="flex-1 text-left">{ICON_DISPLAY_NAMES[value] ?? value}</span>
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
			class="absolute z-50 mt-1 w-80 max-h-96 overflow-y-auto bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 p-3"
		>
			{#each Object.entries(ICON_CATEGORIES) as [category, icons]}
				<div class="mb-3 last:mb-0">
					<h4 class="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-2">
						{category}
					</h4>
					<div class="grid grid-cols-6 gap-1">
						{#each icons as iconName}
							{@const Icon = getIconComponent(iconName)}
							<button
								type="button"
								class="p-2 rounded hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-slate-700 dark:text-slate-300
									{value === iconName
									? 'bg-blue-100 dark:bg-blue-900 ring-2 ring-blue-500 text-blue-700 dark:text-blue-300'
									: ''}"
								onclick={() => selectIcon(iconName)}
								title={ICON_DISPLAY_NAMES[iconName] ?? iconName}
							>
								<Icon class="w-5 h-5 mx-auto" />
							</button>
						{/each}
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>
