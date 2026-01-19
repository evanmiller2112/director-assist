<script lang="ts">
	/**
	 * RelationshipContextSelector Component
	 *
	 * Issue #62 & #134: Relationship Context UI with Cache Status
	 *
	 * Main component for selecting which relationships to include in AI generation context.
	 * Displays collapsible list of relationships with cache status, selection controls,
	 * and token count estimate.
	 */
	import type { BaseEntity, EntityLink } from '$lib/types';
	import type { CacheStatus } from '$lib/types/cache';
	import { ChevronDown, ChevronUp, Network } from 'lucide-svelte';
	import RelationshipContextItem from './RelationshipContextItem.svelte';

	export interface RelationshipContextData {
		relationship: EntityLink;
		targetEntity: BaseEntity;
		cacheStatus: CacheStatus;
		summary?: string;
		generatedAt?: Date;
		tokenCount?: number;
		included?: boolean;
		regenerating?: boolean;
	}

	interface Props {
		sourceEntity: BaseEntity;
		relationshipContext: RelationshipContextData[];
		onContextChange?: (context: RelationshipContextData[]) => void;
		onRegenerate?: (index: number) => void;
	}

	let { sourceEntity, relationshipContext, onContextChange, onRegenerate }: Props = $props();

	let isExpanded = $state(false);

	// Calculate total token count for included relationships
	const totalTokens = $derived(
		relationshipContext
			.filter((ctx) => ctx.included)
			.reduce((sum, ctx) => sum + (ctx.tokenCount || 0), 0)
	);

	// Calculate cache status summary
	const cacheStatusSummary = $derived.by(() => {
		const summary = {
			valid: 0,
			stale: 0,
			missing: 0
		};

		for (const ctx of relationshipContext) {
			summary[ctx.cacheStatus]++;
		}

		return summary;
	});

	function toggleExpanded() {
		isExpanded = !isExpanded;
	}

	function handleSelectAll() {
		const updatedContext = relationshipContext.map((ctx) => ({
			...ctx,
			included: true
		}));
		onContextChange?.(updatedContext);
	}

	function handleSelectNone() {
		const updatedContext = relationshipContext.map((ctx) => ({
			...ctx,
			included: false
		}));
		onContextChange?.(updatedContext);
	}

	function handleToggleItem(index: number) {
		const updatedContext = relationshipContext.map((ctx, i) =>
			i === index ? { ...ctx, included: !ctx.included } : ctx
		);
		onContextChange?.(updatedContext);
	}
</script>

<div class="border-b border-slate-200 dark:border-slate-700">
	<!-- Header / Toggle -->
	<button
		type="button"
		onclick={toggleExpanded}
		aria-expanded={isExpanded}
		class="w-full px-4 py-2 flex items-center justify-between text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
	>
		<span class="flex items-center gap-2">
			<Network class="w-4 h-4" />
			Relationship Context
			<span
				class="bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full text-xs font-medium"
			>
				{relationshipContext.length}
			</span>
		</span>
		<div data-testid="chevron" class={isExpanded ? 'rotate-180 transform' : ''}>
			{#if isExpanded}
				<ChevronDown class="w-4 h-4 transition-transform" />
			{:else}
				<ChevronDown class="w-4 h-4 transition-transform" />
			{/if}
		</div>
	</button>

	<!-- Expanded content -->
	<div
		data-testid="relationship-list"
		role="region"
		aria-label="Relationship Context"
		class="px-4 pb-3 space-y-3"
		class:hidden={!isExpanded}
		style={isExpanded ? '' : 'display: none;'}
	>
			{#if relationshipContext.length === 0}
				<p class="text-sm text-slate-400 dark:text-slate-500 text-center py-4">
					No relationships found
				</p>
			{:else}
				<!-- Controls: Select All / Select None -->
				<div class="flex items-center justify-between pt-2">
					<div class="flex items-center gap-2">
						<button
							type="button"
							onclick={handleSelectAll}
							class="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
						>
							Select All
						</button>
						<span class="text-slate-300 dark:text-slate-600">|</span>
						<button
							type="button"
							onclick={handleSelectNone}
							class="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
						>
							Select None
						</button>
					</div>
				</div>

				<!-- Cache Status Summary -->
				<div class="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
					{#if cacheStatusSummary.valid > 0}
						<span class="flex items-center gap-1">
							<span class="w-2 h-2 rounded-full bg-green-500"></span>
							{cacheStatusSummary.valid} valid
						</span>
					{/if}
					{#if cacheStatusSummary.stale > 0}
						<span class="flex items-center gap-1">
							<span class="w-2 h-2 rounded-full bg-yellow-500"></span>
							{cacheStatusSummary.stale} stale
						</span>
					{/if}
					{#if cacheStatusSummary.missing > 0}
						<span class="flex items-center gap-1">
							<span class="w-2 h-2 rounded-full bg-gray-400"></span>
							{cacheStatusSummary.missing} missing
						</span>
					{/if}
				</div>

				<!-- Relationship list -->
				<div class="space-y-2">
					{#each relationshipContext as ctx, index}
						<RelationshipContextItem
							targetEntity={ctx.targetEntity}
							relationship={ctx.relationship}
							included={ctx.included ?? false}
							cacheStatus={ctx.cacheStatus}
							summary={ctx.summary}
							generatedAt={ctx.generatedAt}
							tokenCount={ctx.tokenCount}
							regenerating={ctx.regenerating}
							onToggle={() => handleToggleItem(index)}
							onRegenerate={ctx.regenerating ? undefined : () => onRegenerate?.(index)}
						/>
					{/each}
				</div>

				<!-- Token count estimate -->
				<div
					class="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-700"
				>
					<span class="text-xs text-slate-500 dark:text-slate-400">
						Total context: {totalTokens.toLocaleString('en-US')} token{totalTokens === 1 ? '' : 's'}
					</span>
				</div>
			{/if}
		</div>
</div>

