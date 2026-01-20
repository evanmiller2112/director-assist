<script lang="ts">
	import type { AISuggestion } from '$lib/types';
	import { X } from 'lucide-svelte';

	interface Entity {
		id: string;
		name: string;
		type: string;
	}

	interface Props {
		open?: boolean;
		suggestion: AISuggestion;
		entities?: Entity[];
		onClose?: () => void;
		onExecute?: (suggestion: AISuggestion) => void;
		onDismiss?: (suggestionId: string) => void;
		onSnooze?: (suggestionId: string) => void;
		loading?: boolean;
	}

	let {
		open = $bindable(false),
		suggestion,
		entities = [],
		onClose,
		onExecute,
		onDismiss,
		onSnooze,
		loading = false
	}: Props = $props();

	// Create a unique ID for the title to use with aria-labelledby
	const titleId = `suggestion-details-title-${suggestion.id}`;

	// Get entity name by ID, fallback to ID if not found
	function getEntityName(entityId: string): string {
		const entity = entities.find((e) => e.id === entityId);
		return entity?.name || entityId;
	}

	// Get entity by ID
	function getEntity(entityId: string): Entity | undefined {
		return entities.find((e) => e.id === entityId);
	}

	// Format suggestion type for display
	function formatSuggestionType(type: string): string {
		return type.replace(/_/g, ' ');
	}

	// Get action type display text
	function getActionTypeText(actionType: string): string {
		const typeMap: Record<string, string> = {
			'create-relationship': 'Create Relationship',
			'edit-entity': 'Edit Entity',
			'create-entity': 'Create Entity',
			'flag-for-review': 'Flag for Review'
		};
		return typeMap[actionType] || actionType;
	}

	function handleClose() {
		open = false;
		onClose?.();
	}

	function handleBackdropClick(e: MouseEvent) {
		if (e.target === e.currentTarget) {
			handleClose();
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape' && open) {
			handleClose();
		}
	}

	function handleExecute() {
		if (!loading) {
			onExecute?.(suggestion);
		}
	}

	function handleDismiss() {
		if (!loading) {
			onDismiss?.(suggestion.id);
		}
	}

	function handleSnooze() {
		if (!loading) {
			onSnooze?.(suggestion.id);
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

{#if open}
	<div
		class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
		onclick={handleBackdropClick}
		role="presentation"
	>
		<div
			class="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-3xl w-full max-h-[80vh] overflow-hidden flex flex-col"
			onclick={(e) => e.stopPropagation()}
			role="dialog"
			aria-modal="true"
			aria-labelledby={titleId}
		>
			<!-- Header -->
			<div class="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
				<div class="flex items-center gap-3 flex-1">
					<h2 id={titleId} class="text-lg font-semibold text-slate-900 dark:text-white">
						{suggestion.title}
					</h2>
					<span
						class="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200"
					>
						{formatSuggestionType(suggestion.type)}
					</span>
				</div>
				<button
					onclick={handleClose}
					class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
					aria-label="Close"
				>
					<X size={20} />
				</button>
			</div>

			<!-- Content -->
			<div class="flex-1 overflow-y-auto p-6 space-y-6">
				<!-- Relevance Score -->
				<div class="flex items-center gap-2">
					<span class="text-sm font-medium text-slate-700 dark:text-slate-300">Relevance:</span>
					<span class="text-sm text-slate-900 dark:text-white font-semibold">{suggestion.relevanceScore}</span>
				</div>

				<!-- Description -->
				<div>
					<h3 class="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Description</h3>
					<p class="text-slate-900 dark:text-white whitespace-pre-wrap">{suggestion.description}</p>
				</div>

				<!-- Affected Entities -->
				{#if suggestion.affectedEntityIds.length > 0}
					<div>
						<h3 class="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Affected Entities</h3>
						<ul class="space-y-2">
							{#each suggestion.affectedEntityIds as entityId}
								{@const entity = getEntity(entityId)}
								<li>
									{#if entity}
										<a
											href="/entities/{entityId}"
											class="text-blue-600 dark:text-blue-400 hover:underline"
										>
											{entity.name}
										</a>
										<span class="text-xs text-slate-500 dark:text-slate-400 ml-2">
											{entity.type}
										</span>
									{:else}
										<span class="text-slate-900 dark:text-white">{entityId}</span>
									{/if}
								</li>
							{/each}
						</ul>
					</div>
				{/if}

				<!-- Suggested Action -->
				{#if suggestion.suggestedAction}
					<div>
						<h3 class="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Suggested Action</h3>
						<div class="bg-slate-50 dark:bg-slate-900 rounded-lg p-4 space-y-2">
							<div class="font-medium text-slate-900 dark:text-white">
								{getActionTypeText(suggestion.suggestedAction.actionType)}
							</div>

							<!-- Action-specific details -->
							{#if suggestion.suggestedAction.actionType === 'create-relationship'}
								{@const actionData = suggestion.suggestedAction.actionData}
								<div class="text-sm text-slate-700 dark:text-slate-300">
									<span>Relationship:</span>
									<span class="font-medium ml-1">{actionData.relationship}</span>
								</div>
							{:else if suggestion.suggestedAction.actionType === 'edit-entity'}
								<div class="text-sm text-slate-700 dark:text-slate-300">
									Update entity properties
								</div>
							{:else if suggestion.suggestedAction.actionType === 'create-entity'}
								{@const actionData = suggestion.suggestedAction.actionData}
								<div class="text-sm text-slate-700 dark:text-slate-300">
									<span>Type:</span>
									<span class="font-medium ml-1">{actionData.type}</span>
									<span class="mx-2">•</span>
									<span>Name:</span>
									<span class="font-medium ml-1">{actionData.name}</span>
								</div>
							{:else if suggestion.suggestedAction.actionType === 'flag-for-review'}
								{@const actionData = suggestion.suggestedAction.actionData}
								<div class="text-sm text-slate-700 dark:text-slate-300">
									{actionData.reason || 'Flag entities for manual review'}
								</div>
							{/if}
						</div>
					</div>
				{/if}
			</div>

			<!-- Footer Actions -->
			<div class="flex items-center justify-end gap-3 p-4 border-t border-slate-200 dark:border-slate-700">
				<button
					onclick={handleSnooze}
					disabled={loading}
					class="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
				>
					Snooze
				</button>

				<button
					onclick={handleDismiss}
					disabled={loading}
					class="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
				>
					Dismiss
				</button>

				{#if suggestion.suggestedAction}
					<button
						onclick={handleExecute}
						disabled={loading}
						aria-busy={loading}
						class="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
					>
						Execute
					</button>
				{/if}
			</div>
		</div>
	</div>
{/if}
