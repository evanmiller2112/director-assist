<script lang="ts">
	/**
	 * NetworkDiagram Component
	 *
	 * Issue #74: Network Diagram Visualization
	 * Renders a network diagram using vis.js library
	 */
	import { onMount, onDestroy } from 'svelte';
	import { Network } from 'vis-network';
	import type { RelationshipMap } from '$lib/db/repositories/entityRepository';
	import type { SelectedNode, SelectedEdge } from '$lib/types/network';
	import { toVisNetworkData } from '$lib/utils/networkGraph';

	interface Props {
		relationshipMap: RelationshipMap;
		isDark: boolean;
		onNodeClick?: (node: SelectedNode) => void;
		onEdgeClick?: (edge: SelectedEdge) => void;
	}

	let { relationshipMap, isDark, onNodeClick, onEdgeClick }: Props = $props();

	let container: HTMLDivElement | undefined = $state();
	let network: Network | null = null;

	// Create network visualization
	onMount(() => {
		if (!container || !relationshipMap || relationshipMap.nodes.length === 0) {
			return;
		}

		const data = toVisNetworkData(relationshipMap, { isDark });

		const options: Record<string, unknown> = {
			nodes: {
				font: {
					color: isDark ? '#e5e7eb' : '#1f2937'
				},
				borderWidth: 2,
				borderWidthSelected: 3
			},
			edges: {
				font: {
					color: isDark ? '#9ca3af' : '#6b7280',
					size: 12
				},
				color: {
					color: isDark ? '#6b7280' : '#9ca3af',
					highlight: isDark ? '#3b82f6' : '#2563eb'
				},
				smooth: {
					type: 'continuous'
				}
			},
			physics: {
				enabled: true,
				stabilization: {
					iterations: 200
				},
				barnesHut: {
					gravitationalConstant: -2000,
					centralGravity: 0.3,
					springLength: 150,
					springConstant: 0.04,
					damping: 0.09
				}
			},
			interaction: {
				hover: true,
				tooltipDelay: 100,
				navigationButtons: true,
				keyboard: true
			}
		};

		network = new Network(container, data, options);

		// Handle node clicks
		network.on('click', (params) => {
			if (params.nodes.length > 0 && onNodeClick) {
				const nodeId = params.nodes[0];
				const node = relationshipMap.nodes.find((n) => n.id === nodeId);
				if (node) {
					onNodeClick({
						id: node.id,
						name: node.name,
						type: node.type,
						linkCount: node.linkCount
					});
				}
			} else if (params.edges.length > 0 && onEdgeClick) {
				const edgeId = params.edges[0];
				const edge = relationshipMap.edges.find((e) => e.id === edgeId);
				if (edge) {
					const sourceNode = relationshipMap.nodes.find((n) => n.id === edge.source);
					const targetNode = relationshipMap.nodes.find((n) => n.id === edge.target);
					if (sourceNode && targetNode) {
						onEdgeClick({
							id: edge.id,
							source: edge.source,
							target: edge.target,
							sourceName: sourceNode.name,
							targetName: targetNode.name,
							relationship: edge.relationship,
							bidirectional: edge.bidirectional,
							strength: edge.strength
						});
					}
				}
			}
		});
	});

	// Update network when data changes
	$effect(() => {
		if (network && relationshipMap && relationshipMap.nodes.length > 0) {
			const data = toVisNetworkData(relationshipMap, { isDark });
			network.setData(data);
		}
	});

	// Cleanup on destroy
	onDestroy(() => {
		if (network) {
			network.destroy();
			network = null;
		}
	});
</script>

{#if !relationshipMap || relationshipMap.nodes.length === 0}
	<div
		class="flex items-center justify-center h-full text-slate-500 dark:text-slate-400"
		data-testid="network-diagram"
	>
		<p>No entities to display</p>
	</div>
{:else}
	<div bind:this={container} data-testid="network-diagram" class="w-full h-full min-h-[500px]"></div>
{/if}
