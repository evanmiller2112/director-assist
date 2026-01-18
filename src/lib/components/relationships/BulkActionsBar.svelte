<script lang="ts">
	interface Props {
		selectedCount: number;
		onBulkDelete: () => void;
		onBulkUpdateStrength: (strength: 'strong' | 'moderate' | 'weak') => void;
		onBulkAddTag: (tag: string) => void;
		onClearSelection: () => void;
	}

	let { selectedCount, onBulkDelete, onBulkUpdateStrength, onBulkAddTag, onClearSelection }: Props = $props();

	let tagInput = $state('');
	let strengthSelect = $state('');

	function handleStrengthChange(e: Event) {
		const value = (e.target as HTMLSelectElement).value as 'strong' | 'moderate' | 'weak';
		if (value) {
			onBulkUpdateStrength(value);
			strengthSelect = ''; // Reset select
		}
	}

	function handleAddTag() {
		const trimmedTag = tagInput.trim();
		if (trimmedTag) {
			onBulkAddTag(trimmedTag);
			tagInput = '';
		}
	}

	function handleTagKeyDown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			e.preventDefault();
			handleAddTag();
		}
	}
</script>

{#if selectedCount > 0}
	<div role="toolbar" aria-label="Bulk actions" class="sticky bottom-0 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 p-4 shadow-lg flex items-center gap-4">
		<!-- Selected Count -->
		<div class="text-sm font-medium text-slate-700 dark:text-slate-300">
			{selectedCount} selected
		</div>

		<!-- Delete Button -->
		<button
			type="button"
			onclick={onBulkDelete}
			class="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800 rounded danger"
		>
			Delete
		</button>

		<!-- Strength Dropdown -->
		<div class="flex items-center gap-2">
			<label for="bulk-strength" class="text-sm font-medium text-slate-700 dark:text-slate-300">
				Update Strength
			</label>
			<select
				id="bulk-strength"
				value={strengthSelect}
				onchange={handleStrengthChange}
				class="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm"
			>
				<option value="">Set strength...</option>
				<option value="strong">Strong</option>
				<option value="moderate">Moderate</option>
				<option value="weak">Weak</option>
			</select>
		</div>

		<!-- Add Tag -->
		<div class="flex items-center gap-2">
			<input
				type="text"
				bind:value={tagInput}
				onkeydown={handleTagKeyDown}
				placeholder="Add tag..."
				class="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm"
			/>
			<button
				type="button"
				onclick={handleAddTag}
				class="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded"
			>
				Add Tag
			</button>
		</div>

		<!-- Clear Selection -->
		<button
			type="button"
			onclick={onClearSelection}
			class="ml-auto px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white secondary"
		>
			Clear Selection
		</button>
	</div>
{:else}
	<!-- Render nothing explicitly -->
{/if}
