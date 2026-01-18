<script lang="ts">
	/**
	 * Network Diagram Page
	 *
	 * Issue #74: Network Diagram Visualization
	 * Main page for the network diagram visualization with filtering and details panels
	 */
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { entityRepository } from '$lib/db/repositories/entityRepository';
	import type { RelationshipMap } from '$lib/db/repositories/entityRepository';
	import type { NetworkFilterOptions } from '$lib/types/network';
	import type { SelectedNode, SelectedEdge } from '$lib/types/network';
	import NetworkDiagram from '$lib/components/relationships/NetworkDiagram.svelte';
	import NetworkFilterPanel from '$lib/components/relationships/NetworkFilterPanel.svelte';
	import NetworkNodeDetails from '$lib/components/relationships/NetworkNodeDetails.svelte';
	import NetworkEdgeDetails from '$lib/components/relationships/NetworkEdgeDetails.svelte';

	// State
	let relationshipMap: RelationshipMap = $state({ nodes: [], edges: [] });
	let filteredMap: RelationshipMap = $state({ nodes: [], edges: [] });
	let filters: NetworkFilterOptions = $state({});
	let selectedNode: SelectedNode | null = $state(null);
	let selectedEdge: SelectedEdge | null = $state(null);
	let isDark = $state(false);
	let isLoading = $state(true);

	// Available relationship types from the data
	const availableRelationships = $derived(
		Array.from(new Set(relationshipMap.edges.map((e) => e.relationship)))
	);

	// Load data on mount
	onMount(() => {
		(async () => {
			try {
				relationshipMap = await entityRepository.getRelationshipMap({});
				filteredMap = relationshipMap;
				isLoading = false;
			} catch (error) {
				console.error('Failed to load relationship map:', error);
				isLoading = false;
			}
		})();

		// Detect dark mode
		const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
		isDark = darkModeMediaQuery.matches;

		// Listen for theme changes
		const handleThemeChange = (e: MediaQueryListEvent) => {
			isDark = e.matches;
		};
		darkModeMediaQuery.addEventListener('change', handleThemeChange);

		return () => {
			darkModeMediaQuery.removeEventListener('change', handleThemeChange);
		};
	});

	// Apply filters when they change
	function handleFilterChange(newFilters: NetworkFilterOptions) {
		filters = newFilters;
		applyFilters();
	}

	function applyFilters() {
		if (!relationshipMap) return;

		let nodes = [...relationshipMap.nodes];
		let edges = [...relationshipMap.edges];

		// Filter by entity types
		if (filters.entityTypes && filters.entityTypes.length > 0) {
			const allowedTypes = new Set(filters.entityTypes);
			nodes = nodes.filter((n) => allowedTypes.has(n.type));

			// Filter edges to only include those between allowed nodes
			const allowedNodeIds = new Set(nodes.map((n) => n.id));
			edges = edges.filter((e) => allowedNodeIds.has(e.source) && allowedNodeIds.has(e.target));
		}

		// Filter by relationship types
		if (filters.relationshipTypes && filters.relationshipTypes.length > 0) {
			const allowedRelationships = new Set(filters.relationshipTypes);
			edges = edges.filter((e) => allowedRelationships.has(e.relationship));

			// Remove nodes that have no edges
			const connectedNodeIds = new Set([
				...edges.map((e) => e.source),
				...edges.map((e) => e.target)
			]);
			nodes = nodes.filter((n) => connectedNodeIds.has(n.id));
		}

		filteredMap = { nodes, edges };

		// Clear selection if selected items are filtered out
		if (selectedNode && !nodes.find((n) => n.id === selectedNode!.id)) {
			selectedNode = null;
		}
		if (selectedEdge && !edges.find((e) => e.id === selectedEdge!.id)) {
			selectedEdge = null;
		}
	}

	// Handle node selection
	function handleNodeClick(node: SelectedNode) {
		selectedNode = node;
		selectedEdge = null; // Clear edge selection
	}

	// Handle edge selection
	function handleEdgeClick(edge: SelectedEdge) {
		selectedEdge = edge;
		selectedNode = null; // Clear node selection
	}

	// Navigate to entity detail page
	function handleNavigate(entityId: string) {
		const node = relationshipMap.nodes.find((n) => n.id === entityId);
		if (node) {
			goto(`/entities/${node.type}/${entityId}`);
		}
	}

	// Close details panels
	function closeNodeDetails() {
		selectedNode = null;
	}

	function closeEdgeDetails() {
		selectedEdge = null;
	}
</script>

<svelte:head>
	<title>Relationship Network - Director Assist</title>
</svelte:head>

<div class="container mx-auto px-4 py-6 h-screen flex flex-col">
	<h1 class="text-2xl font-bold text-slate-900 dark:text-white mb-6">Relationship Network</h1>

	{#if isLoading}
		<div class="flex items-center justify-center flex-1">
			<div class="text-slate-500 dark:text-slate-400">Loading network diagram...</div>
		</div>
	{:else}
		<div class="flex-1 flex gap-6 overflow-hidden">
			<!-- Filter Panel (Left Sidebar) -->
			<aside class="w-64 flex-shrink-0 overflow-y-auto">
				<NetworkFilterPanel
					{filters}
					onFilterChange={handleFilterChange}
					{availableRelationships}
				/>
			</aside>

			<!-- Main Network Diagram -->
			<main class="flex-1 bg-white dark:bg-slate-800 rounded-lg shadow-lg overflow-hidden">
				<NetworkDiagram
					relationshipMap={filteredMap}
					{isDark}
					onNodeClick={handleNodeClick}
					onEdgeClick={handleEdgeClick}
				/>
			</main>

			<!-- Details Panel (Right Sidebar) -->
			<aside class="w-80 flex-shrink-0 overflow-y-auto">
				{#if selectedNode}
					<NetworkNodeDetails
						node={selectedNode}
						onNavigate={handleNavigate}
						onClose={closeNodeDetails}
					/>
				{:else if selectedEdge}
					<NetworkEdgeDetails
						edge={selectedEdge}
						onNavigateToSource={handleNavigate}
						onNavigateToTarget={handleNavigate}
						onClose={closeEdgeDetails}
					/>
				{:else}
					<div
						class="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6 text-center text-slate-500 dark:text-slate-400"
					>
						<p>Click on a node or relationship to view details</p>
					</div>
				{/if}
			</aside>
		</div>

		<!-- Stats Footer -->
		<footer class="mt-4 text-sm text-slate-600 dark:text-slate-400 text-center">
			Showing {filteredMap.nodes.length} entities and {filteredMap.edges.length} relationships
			{#if filteredMap.nodes.length < relationshipMap.nodes.length || filteredMap.edges.length < relationshipMap.edges.length}
				(filtered from {relationshipMap.nodes.length} entities and {relationshipMap.edges.length}
				relationships)
			{/if}
		</footer>
	{/if}
</div>
