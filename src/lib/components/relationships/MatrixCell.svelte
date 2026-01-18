<script lang="ts">
	import { Plus } from 'lucide-svelte';
	import type { MatrixCellData } from '$lib/types/matrix';
	import type { RelationshipMapNode } from '$lib/db/repositories/entityRepository';

	interface Props {
		cell: MatrixCellData | undefined;
		rowEntity: RelationshipMapNode;
		columnEntity: RelationshipMapNode;
		isDiagonal: boolean;
		onClick: () => void;
	}

	let { cell, rowEntity, columnEntity, isDiagonal, onClick }: Props = $props();

	// Determine cell state and styling
	const isEmpty = $derived(!cell || cell.count === 0);
	const count = $derived(cell?.count ?? 0);

	// Color intensity based on count (for visual feedback)
	const colorClass = $derived.by(() => {
		if (isDiagonal) return 'bg-slate-100 dark:bg-slate-800 cursor-not-allowed';
		if (isEmpty) return 'bg-slate-50 dark:bg-slate-900 hover:bg-blue-50 dark:hover:bg-slate-800';
		if (count === 1) return 'bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-800/40';
		if (count === 2) return 'bg-blue-200 dark:bg-blue-800/40 hover:bg-blue-300 dark:hover:bg-blue-700/50';
		return 'bg-blue-300 dark:bg-blue-700/50 hover:bg-blue-400 dark:hover:bg-blue-600/60';
	});

	// Tooltip text
	const tooltipText = $derived.by(() => {
		if (isDiagonal) return 'Same entity';
		if (isEmpty) return `Click to add relationship between ${rowEntity.name} and ${columnEntity.name}`;

		const relationshipsList = cell!.relationships
			.map((rel) => {
				const direction = rel.source === rowEntity.id ? '→' : '←';
				return `${direction} ${rel.relationship}${rel.bidirectional ? ' (bidirectional)' : ''}`;
			})
			.join('\n');

		return `${count} relationship${count > 1 ? 's' : ''} between ${rowEntity.name} and ${columnEntity.name}:\n${relationshipsList}`;
	});

	function handleClick() {
		if (!isDiagonal) {
			onClick();
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (!isDiagonal && (e.key === 'Enter' || e.key === ' ')) {
			e.preventDefault();
			onClick();
		}
	}
</script>

<button
	type="button"
	class="relative w-full h-16 border border-slate-200 dark:border-slate-700 transition-colors duration-150 {colorClass} {isDiagonal ? '' : 'cursor-pointer'}"
	title={tooltipText}
	onclick={handleClick}
	onkeydown={handleKeydown}
	disabled={isDiagonal}
	aria-label={tooltipText}
>
	{#if !isDiagonal}
		<div class="flex items-center justify-center h-full">
			{#if isEmpty}
				<Plus class="w-4 h-4 text-slate-400 dark:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity" />
			{:else}
				<span class="text-sm font-medium text-slate-700 dark:text-slate-200">
					{count}
				</span>
			{/if}
		</div>
	{/if}
</button>

<style>
	button:hover .lucide-plus {
		opacity: 1;
	}
</style>
