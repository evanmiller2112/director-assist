<script lang="ts">
	/**
	 * RelationshipContextItem Component
	 *
	 * Issue #62 & #134: Relationship Context UI with Cache Status
	 *
	 * Displays a single relationship with checkbox, summary preview, cache status,
	 * and regenerate button. Used within RelationshipContextSelector.
	 */
	import type { BaseEntity, EntityLink } from '$lib/types';
	import type { CacheStatus } from '$lib/types/cache';
	import { formatRelativeTime } from '$lib/utils/timeFormat';
	import { RefreshCw } from 'lucide-svelte';

	interface Props {
		targetEntity: BaseEntity;
		relationship: EntityLink;
		included: boolean;
		cacheStatus: CacheStatus;
		summary?: string;
		generatedAt?: Date;
		tokenCount?: number;
		regenerating?: boolean;
		onToggle?: () => void;
		onRegenerate?: () => void;
	}

	let {
		targetEntity,
		relationship,
		included,
		cacheStatus,
		summary,
		generatedAt,
		tokenCount,
		regenerating = false,
		onToggle,
		onRegenerate
	}: Props = $props();

	// Format relationship type for display (convert underscores to spaces)
	const formattedRelationship = $derived(
		relationship.relationship.replace(/_/g, ' ')
	);

	// Get cache status badge configuration
	const cacheStatusConfig = $derived.by(() => {
		switch (cacheStatus) {
			case 'valid':
				return {
					label: 'Valid',
					classes: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 green success'
				};
			case 'stale':
				return {
					label: 'Stale',
					classes: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300 yellow warning amber'
				};
			case 'missing':
				return {
					label: 'No Cache',
					classes: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 gray muted neutral'
				};
		}
	});

	// Format token count with separator
	const formattedTokenCount = $derived(
		tokenCount !== undefined ? tokenCount.toLocaleString('en-US') : undefined
	);

	function handleToggle() {
		onToggle?.();
	}

	function handleRegenerate() {
		if (!regenerating) {
			onRegenerate?.();
		}
	}
</script>

<div
	data-testid="relationship-item"
	class="p-3 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors"
	class:selected={included}
	class:active={included}
	class:included={included}
	class:bg-white={included}
	class:dark:bg-slate-800={included}
	class:muted={!included}
	class:inactive={!included}
	class:disabled={!included}
	class:bg-slate-50={!included}
	class:dark:bg-slate-900={!included}
	class:opacity-60={!included}
	class:stale={cacheStatus === 'stale'}
	class:warning={cacheStatus === 'stale'}
	class:border-yellow-300={cacheStatus === 'stale' && included}
	class:dark:border-yellow-600={cacheStatus === 'stale' && included}
>
	<div class="flex items-start gap-3">
		<!-- Checkbox -->
		<input
			type="checkbox"
			checked={included}
			onchange={handleToggle}
			aria-label="Include {targetEntity.name} in context"
			class="mt-1 w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500"
		/>

		<!-- Content -->
		<div class="flex-1 min-w-0">
			<!-- Entity name and type -->
			<div class="flex items-start justify-between gap-2 mb-1">
				<div class="flex-1 min-w-0">
					<h4 class="text-sm font-medium text-slate-900 dark:text-white truncate">
						{targetEntity.name}
					</h4>
					<div class="flex items-center gap-2 mt-0.5">
						<span class="text-xs text-slate-500 dark:text-slate-400">
							{targetEntity.type} · {formattedRelationship}
						</span>
					</div>
				</div>

				<!-- Cache status badge -->
				<div class="flex items-center gap-2">
					<span
						data-testid="cache-status"
						class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium {cacheStatusConfig.classes} badge"
					>
						{cacheStatusConfig.label}
					</span>
					{#if generatedAt}
						<span class="text-xs text-slate-500 dark:text-slate-400">
							· Cached {formatRelativeTime(generatedAt)}
						</span>
					{/if}
				</div>
			</div>

			<!-- Summary or placeholder -->
			{#if summary}
				<p
					data-testid="summary"
					class="text-sm text-slate-700 dark:text-slate-300 line-clamp-2 mb-2"
				>
					{summary}
				</p>
			{:else}
				<p class="text-sm text-slate-400 dark:text-slate-500 italic mb-2">
					No summary generated
				</p>
			{/if}

			<!-- Footer: Token count and regenerate button -->
			<div class="flex items-center justify-between">
				<!-- Token count -->
				{#if tokenCount !== undefined}
					<span class="text-xs text-slate-500 dark:text-slate-400">
						{formattedTokenCount} tokens
					</span>
				{:else}
					<span></span>
				{/if}

				<!-- Regenerate button -->
				<button
					type="button"
					onclick={handleRegenerate}
					disabled={regenerating}
					aria-label="Regenerate relationship summary"
					aria-busy={regenerating}
					class="flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
				>
					{#if regenerating}
						<span role="status" class="w-3.5 h-3.5 animate-spin">
							<RefreshCw class="w-3.5 h-3.5" />
						</span>
					{:else}
						<RefreshCw class="w-3.5 h-3.5" />
					{/if}
					{regenerating ? 'Regenerating...' : 'Regenerate'}
				</button>
			</div>
		</div>
	</div>
</div>

<style>
	.line-clamp-2 {
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	@keyframes spin {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}

	.animate-spin {
		animation: spin 1s linear infinite;
	}
</style>
