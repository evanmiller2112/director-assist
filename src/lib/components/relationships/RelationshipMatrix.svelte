<script lang="ts">
	import MatrixCell from './MatrixCell.svelte';
	import { getCellKey } from '$lib/utils/matrixUtils';
	import type { MatrixData } from '$lib/types/matrix';

	interface Props {
		matrixData: MatrixData;
		onCellClick: (rowEntityId: string, columnEntityId: string) => void;
	}

	let { matrixData, onCellClick }: Props = $props();

	// Determine if rows and columns are the same type (same-type matrix)
	const isSameTypeMatrix = $derived(
		matrixData.rowEntities.length > 0 &&
		matrixData.columnEntities.length > 0 &&
		matrixData.rowEntities[0]?.type === matrixData.columnEntities[0]?.type
	);

	function handleCellClick(rowEntityId: string, columnEntityId: string) {
		onCellClick(rowEntityId, columnEntityId);
	}
</script>

<div class="w-full overflow-x-auto overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-lg">
	{#if matrixData.rowEntities.length === 0 || matrixData.columnEntities.length === 0}
		<div class="p-8 text-center text-slate-500 dark:text-slate-400">
			<p class="text-lg">No entities to display in the matrix.</p>
			<p class="text-sm mt-2">Adjust your filters or add more entities and relationships.</p>
		</div>
	{:else}
		<div class="inline-block min-w-full">
			<!-- CSS Grid for the matrix -->
			<div
				class="grid"
				style="grid-template-columns: auto repeat({matrixData.columnEntities.length}, minmax(80px, 1fr));"
			>
				<!-- Top-left corner cell (empty) -->
				<div class="sticky top-0 left-0 z-20 bg-slate-100 dark:bg-slate-800 border-b border-r border-slate-200 dark:border-slate-700 p-2">
					<span class="text-xs font-medium text-slate-600 dark:text-slate-400">
						{#if isSameTypeMatrix}
							Entity
						{:else}
							Row / Column
						{/if}
					</span>
				</div>

				<!-- Column headers (sticky at top) -->
				{#each matrixData.columnEntities as colEntity}
					<div
						class="sticky top-0 z-10 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-2 text-center"
					>
						<div class="text-sm font-medium text-slate-700 dark:text-slate-200 truncate" title={colEntity.name}>
							{colEntity.name}
						</div>
						<div class="text-xs text-slate-500 dark:text-slate-400">
							({colEntity.linkCount})
						</div>
					</div>
				{/each}

				<!-- Matrix rows -->
				{#each matrixData.rowEntities as rowEntity}
					<!-- Row header (sticky at left) -->
					<div
						class="sticky left-0 z-10 bg-slate-100 dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 p-2 flex items-center"
					>
						<div class="min-w-0">
							<div class="text-sm font-medium text-slate-700 dark:text-slate-200 truncate" title={rowEntity.name}>
								{rowEntity.name}
							</div>
							<div class="text-xs text-slate-500 dark:text-slate-400">
								({rowEntity.linkCount})
							</div>
						</div>
					</div>

					<!-- Matrix cells for this row -->
					{#each matrixData.columnEntities as colEntity}
						{@const cellKey = getCellKey(rowEntity.id, colEntity.id)}
						{@const cell = matrixData.cells.get(cellKey)}
						{@const isDiagonal = isSameTypeMatrix && rowEntity.id === colEntity.id}
						<div class="group">
							<MatrixCell
								{cell}
								rowEntity={rowEntity}
								columnEntity={colEntity}
								{isDiagonal}
								onClick={() => handleCellClick(rowEntity.id, colEntity.id)}
							/>
						</div>
					{/each}
				{/each}
			</div>
		</div>
	{/if}
</div>

<style>
	/* Ensure sticky positioning works properly */
	.sticky {
		position: sticky;
	}

	/* Prevent text selection in headers for better UX */
	.sticky {
		user-select: none;
	}
</style>
