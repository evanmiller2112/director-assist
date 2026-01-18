<script lang="ts">
	import { ChevronRight, X } from 'lucide-svelte';
	import type { BreadcrumbSegment } from '$lib/utils/breadcrumbUtils';

	interface Props {
		segments: BreadcrumbSegment[];
		currentEntity: { id: string; name: string; type: string };
		maxVisible?: number;
		onNavigate?: (index: number) => void;
		onClear?: () => void;
	}

	let { segments, currentEntity, maxVisible = 5, onNavigate, onClear }: Props = $props();

	// Determine which segments to display based on maxVisible
	const visibleSegments = $derived(() => {
		if (segments.length <= maxVisible) {
			return segments;
		}
		// Show most recent segments when truncated
		return segments.slice(-maxVisible);
	});

	const showEllipsis = $derived(segments.length > maxVisible);

	function handleSegmentClick(index: number) {
		if (onNavigate) {
			// Calculate the actual index in the full segments array
			const actualIndex = showEllipsis ? segments.length - maxVisible + index : index;
			onNavigate(actualIndex);
		}
	}

	function handleClear() {
		if (onClear) {
			onClear();
		}
	}
</script>

<nav aria-label="Breadcrumb navigation" class="flex items-center flex-wrap gap-2 mb-4">
	<ol class="flex items-center flex-wrap gap-2" role="list" aria-label="Breadcrumb">
		<!-- Ellipsis for truncated segments -->
		{#if showEllipsis}
			<li class="flex items-center gap-2">
				<span class="text-slate-400 dark:text-slate-500 text-sm">...</span>
				<ChevronRight class="w-4 h-4 text-slate-400 dark:text-slate-500 separator" />
			</li>
		{/if}

		<!-- Breadcrumb segments -->
		{#each visibleSegments() as segment, index}
			<li class="flex items-center gap-2">
				<button
					type="button"
					onclick={() => handleSegmentClick(index)}
					class="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline transition-colors max-w-[200px] truncate"
				>
					{segment.entityName}
				</button>
				<ChevronRight class="w-4 h-4 text-slate-400 dark:text-slate-500 separator" />
			</li>
		{/each}

		<!-- Current entity (non-clickable) -->
		<li>
			<span
				class="text-sm font-semibold text-slate-900 dark:text-white max-w-[200px] truncate inline-block"
				aria-current="page"
			>
				{currentEntity.name}
			</span>
		</li>
	</ol>

	<!-- Clear button (only shown when segments exist) -->
	{#if segments.length > 0}
		<button
			type="button"
			onclick={handleClear}
			class="ml-auto p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded text-red-600 dark:text-red-400 transition-colors"
			aria-label="Clear breadcrumb trail"
		>
			<X class="w-4 h-4" />
		</button>
	{/if}
</nav>
