<script lang="ts">
	import { Sparkles, Edit2, RefreshCw, Check, X } from 'lucide-svelte';
	import { generateSummary, hasApiKey } from '$lib/services/summaryService';
	import { entitiesStore, notificationStore } from '$lib/stores';
	import type { BaseEntity } from '$lib/types';

	interface Props {
		entity: BaseEntity;
		editable?: boolean;
	}

	let { entity, editable = false }: Props = $props();

	let isGenerating = $state(false);
	let isEditing = $state(false);
	let editValue = $state('');

	const hasSummary = $derived(!!entity.summary && entity.summary.trim() !== '');
	const canGenerate = $derived(hasApiKey());

	async function handleGenerate() {
		isGenerating = true;
		try {
			const result = await generateSummary(entity);
			if (result.success && result.summary) {
				await entitiesStore.update(entity.id, { summary: result.summary });
				notificationStore.success('Summary generated!');
			} else {
				notificationStore.error(result.error ?? 'Failed to generate summary');
			}
		} catch (error) {
			notificationStore.error('An unexpected error occurred');
		} finally {
			isGenerating = false;
		}
	}

	function startEdit() {
		editValue = entity.summary ?? '';
		isEditing = true;
	}

	async function saveEdit() {
		await entitiesStore.update(entity.id, { summary: editValue.trim() || undefined });
		isEditing = false;
		notificationStore.success('Summary saved');
	}

	function cancelEdit() {
		isEditing = false;
	}
</script>

<div class="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
	<div class="flex items-center justify-between mb-2">
		<h3
			class="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2 cursor-help"
			title="This summary will be submitted as context when calling an AI agent for a related task."
		>
			<Sparkles class="w-4 h-4 text-purple-500" />
			Summary
		</h3>

		{#if editable && !isEditing}
			<div class="flex items-center gap-1">
				{#if hasSummary}
					<button
						class="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
						onclick={startEdit}
						title="Edit summary"
					>
						<Edit2 class="w-4 h-4" />
					</button>
				{/if}
				<button
					class="p-1 text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 disabled:opacity-50"
					onclick={handleGenerate}
					disabled={isGenerating || !canGenerate}
					title={canGenerate
						? hasSummary
							? 'Regenerate summary'
							: 'Generate summary'
						: 'Configure API key in Settings'}
				>
					{#if isGenerating}
						<RefreshCw class="w-4 h-4 animate-spin" />
					{:else}
						<Sparkles class="w-4 h-4" />
					{/if}
				</button>
			</div>
		{/if}
	</div>

	{#if isEditing}
		<div class="space-y-2">
			<textarea
				class="input min-h-[60px] text-sm"
				bind:value={editValue}
				placeholder="Enter a brief summary..."
			></textarea>
			<div class="flex justify-end gap-2">
				<button class="btn btn-ghost p-1" onclick={cancelEdit}>
					<X class="w-4 h-4" />
				</button>
				<button class="btn btn-primary py-1 px-2 text-xs" onclick={saveEdit}>
					<Check class="w-4 h-4" />
					Save
				</button>
			</div>
		</div>
	{:else if hasSummary}
		<p class="text-sm text-slate-600 dark:text-slate-400">
			{entity.summary}
		</p>
	{:else}
		<p class="text-sm text-slate-400 dark:text-slate-500 italic">
			{#if canGenerate}
				No summary yet. Click the sparkle icon to generate one.
			{:else}
				Configure your API key in Settings to generate summaries.
			{/if}
		</p>
	{/if}
</div>
