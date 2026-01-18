<script lang="ts">
	/**
	 * NetworkNodeDetails Component
	 *
	 * Issue #74: Network Diagram Visualization
	 * Display details for a selected node in the network diagram
	 */
	import type { SelectedNode } from '$lib/types/network';
	import { X, ExternalLink } from 'lucide-svelte';

	interface Props {
		node: SelectedNode | null | undefined;
		onNavigate?: (entityId: string) => void;
		onClose?: () => void;
	}

	let { node, onNavigate, onClose }: Props = $props();

	// Format entity type for display
	function formatLabel(text: string): string {
		return text
			.split('_')
			.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
			.join(' ');
	}

	// Get entity type color classes
	function getEntityTypeBadgeClasses(type: string): string {
		const colorMap: Record<string, string> = {
			character: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
			npc: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
			location: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
			faction: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
			item: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
			encounter: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
			session: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300',
			deity: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
			timeline_event: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300',
			world_rule: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300',
			player_profile: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300',
			campaign: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300'
		};
		return colorMap[type] || 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
	}

	function handleNavigate() {
		if (node && onNavigate) {
			onNavigate(node.id);
		}
	}

	function handleClose() {
		if (onClose) {
			onClose();
		}
	}
</script>

{#if node}
	<div
		data-testid="node-details"
		class="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6 space-y-4"
	>
		<!-- Header with close button -->
		<div class="flex items-start justify-between">
			<div class="flex-1">
				<h2 class="text-xl font-semibold text-slate-900 dark:text-white mb-2">
					{node.name || 'Unnamed Entity'}
				</h2>
				<span
					data-entity-type={node.type}
					class="inline-block px-2 py-1 rounded text-xs font-medium {getEntityTypeBadgeClasses(
						node.type
					)}"
				>
					{formatLabel(node.type)}
				</span>
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

		<!-- Connection count -->
		<div class="text-sm text-slate-600 dark:text-slate-400">
			{node.linkCount} {node.linkCount === 1 ? 'connection' : 'connections'}
		</div>

		<!-- Actions -->
		<div class="flex gap-2 pt-2">
			<a
				href="/entities/{node.type}/{node.id}"
				class="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 rounded-md"
			>
				<ExternalLink class="w-4 h-4" />
				View Entity
			</a>
			<button
				type="button"
				onclick={handleNavigate}
				class="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-md"
				aria-label="Navigate to entity"
			>
				Navigate
			</button>
		</div>
	</div>
{:else}
	<div class="flex items-center justify-center h-full text-slate-500 dark:text-slate-400 p-6">
		<p class="text-center">Select a node to view details</p>
	</div>
{/if}
