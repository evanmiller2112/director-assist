<script lang="ts">
	/**
	 * NetworkEdgeDetails Component
	 *
	 * Issue #74: Network Diagram Visualization
	 * Display details for a selected edge/relationship in the network diagram
	 */
	import type { SelectedEdge } from '$lib/types/network';
	import { X, ArrowRight, ArrowLeftRight, ExternalLink } from 'lucide-svelte';

	interface Props {
		edge: SelectedEdge | null | undefined;
		onNavigateToSource?: (entityId: string) => void;
		onNavigateToTarget?: (entityId: string) => void;
		onClose?: () => void;
	}

	let { edge, onNavigateToSource, onNavigateToTarget, onClose }: Props = $props();

	// Format relationship type for display
	function formatLabel(text: string): string {
		return text
			.split('_')
			.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
			.join(' ');
	}

	// Get strength color classes
	function getStrengthClasses(strength: 'strong' | 'moderate' | 'weak' | undefined): string {
		switch (strength) {
			case 'strong':
				return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300';
			case 'moderate':
				return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300';
			case 'weak':
				return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
			default:
				return 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300';
		}
	}

	function handleNavigateToSource() {
		if (edge && onNavigateToSource) {
			onNavigateToSource(edge.source);
		}
	}

	function handleNavigateToTarget() {
		if (edge && onNavigateToTarget) {
			onNavigateToTarget(edge.target);
		}
	}

	function handleClose() {
		if (onClose) {
			onClose();
		}
	}
</script>

{#if edge}
	<div
		data-testid="edge-details"
		data-strength={edge.strength}
		data-direction={edge.bidirectional ? 'bidirectional' : 'unidirectional'}
		class="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6 space-y-4"
	>
		<!-- Header with close button -->
		<div class="flex items-start justify-between">
			<div class="flex-1">
				<h2 class="text-xl font-semibold text-slate-900 dark:text-white mb-2">
					{formatLabel(edge.relationship || 'Relationship')}
				</h2>
				<div class="flex flex-wrap items-center gap-2">
					{#if edge.bidirectional}
						<span
							class="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
						>
							<ArrowLeftRight class="w-3 h-3" />
							Bidirectional
						</span>
					{/if}
					{#if edge.strength}
						<span
							data-strength={edge.strength}
							class="inline-block px-2 py-1 rounded text-xs font-medium {getStrengthClasses(
								edge.strength
							)}"
						>
							{edge.strength.charAt(0).toUpperCase() + edge.strength.slice(1)}
						</span>
					{/if}
				</div>
			</div>
			<button
				type="button"
				onclick={handleClose}
				class="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-500 dark:text-slate-400"
				aria-label="Close"
			>
				<X class="w-5 h-5" />
			</button>
		</div>

		<!-- Relationship direction -->
		<div class="space-y-3">
			<div class="flex items-center gap-3">
				<div class="flex-1">
					<div class="text-xs text-slate-500 dark:text-slate-400 mb-1">Source</div>
					<div class="flex items-center gap-2">
						<a
							href="/entities/{edge.source}"
							class="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
						>
							{edge.sourceName}
						</a>
					</div>
				</div>

				<div class="text-slate-400 dark:text-slate-500">
					{#if edge.bidirectional}
						<ArrowLeftRight class="w-5 h-5" data-direction="bidirectional" />
					{:else}
						<ArrowRight class="w-5 h-5" data-direction="unidirectional" />
					{/if}
				</div>

				<div class="flex-1">
					<div class="text-xs text-slate-500 dark:text-slate-400 mb-1">Target</div>
					<div class="flex items-center gap-2">
						<a
							href="/entities/{edge.target}"
							class="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
						>
							{edge.targetName}
						</a>
					</div>
				</div>
			</div>
		</div>

		<!-- Actions -->
		<div class="flex gap-2 pt-2">
			<button
				type="button"
				onclick={handleNavigateToSource}
				class="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-md"
				aria-label="View source entity"
			>
				<ExternalLink class="w-3 h-3" />
				View Source
			</button>
			<button
				type="button"
				onclick={handleNavigateToTarget}
				class="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-md"
				aria-label="View target entity"
			>
				<ExternalLink class="w-3 h-3" />
				View Target
			</button>
		</div>
	</div>
{:else}
	<div class="flex items-center justify-center h-full text-slate-500 dark:text-slate-400 p-6">
		<p class="text-center">Select a relationship to view details</p>
	</div>
{/if}
