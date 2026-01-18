/**
 * Network Graph Utility Functions
 *
 * Issue #74: Network Diagram Visualization
 *
 * Utility functions to convert RelationshipMap data to vis.js network format.
 * These functions handle node shapes, colors, and edge styling.
 *
 * STUB IMPLEMENTATION - Tests should fail in RED phase
 */

import { DataSet } from 'vis-data';
import type { RelationshipMap } from '$lib/db/repositories/entityRepository';
import type { NetworkDisplayOptions } from '$lib/types/network';
import type { EntityType } from '$lib/types';

/**
 * Get the vis.js node shape for an entity type
 */
export function getNodeShape(entityType: EntityType): string {
	const shapeMap: Record<string, string> = {
		character: 'circle',
		npc: 'circle',
		location: 'square',
		faction: 'hexagon',
		item: 'diamond',
		encounter: 'star',
		session: 'star',
		deity: 'triangle',
		timeline_event: 'box',
		world_rule: 'ellipse',
		player_profile: 'circle',
		campaign: 'ellipse'
	};
	return shapeMap[entityType] || 'circle';
}

/**
 * Get the color for an entity type based on theme
 */
export function getEntityColor(entityType: EntityType, isDark: boolean): string {
	const lightColors: Record<string, string> = {
		character: '#3b82f6',
		npc: '#22c55e',
		location: '#f59e0b',
		faction: '#a855f7',
		item: '#f97316',
		encounter: '#ef4444',
		session: '#06b6d4',
		deity: '#eab308',
		timeline_event: '#64748b',
		world_rule: '#6366f1',
		player_profile: '#ec4899',
		campaign: '#8b5cf6'
	};

	const darkColors: Record<string, string> = {
		character: '#1d4ed8',
		npc: '#15803d',
		location: '#b45309',
		faction: '#7c3aed',
		item: '#c2410c',
		encounter: '#b91c1c',
		session: '#0891b2',
		deity: '#a16207',
		timeline_event: '#475569',
		world_rule: '#4f46e5',
		player_profile: '#be185d',
		campaign: '#6d28d9'
	};

	const defaultLight = '#9ca3af'; // gray-400
	const defaultDark = '#6b7280'; // gray-500

	if (isDark) {
		return darkColors[entityType] || defaultDark;
	}
	return lightColors[entityType] || defaultLight;
}

/**
 * Convert RelationshipMap to vis.js DataSet format
 */
export function toVisNetworkData(
	map: RelationshipMap,
	options: NetworkDisplayOptions
): { nodes: DataSet<any>; edges: DataSet<any> } {
	const { isDark } = options;

	// Convert nodes
	const visNodes = map.nodes.map((node) => ({
		id: node.id,
		label: node.name,
		shape: getNodeShape(node.type),
		color: getEntityColor(node.type, isDark),
		title: `${node.name}\nType: ${node.type}\nConnections: ${node.linkCount}`
	}));

	// Convert edges
	const visEdges = map.edges.map((edge) => ({
		id: edge.id,
		from: edge.source,
		to: edge.target,
		label: edge.relationship,
		arrows: edge.bidirectional ? 'to;from' : 'to',
		width: getEdgeWidth(edge.strength),
		dashes: getEdgeDashes(edge.strength)
	}));

	return {
		nodes: new DataSet(visNodes),
		edges: new DataSet(visEdges)
	};
}

/**
 * Get edge dash pattern based on strength
 */
export function getEdgeDashes(
	strength?: 'strong' | 'moderate' | 'weak'
): boolean | number[] {
	switch (strength) {
		case 'strong':
			return false; // solid line
		case 'moderate':
			return [5, 5]; // medium dashes
		case 'weak':
			return [2, 4]; // short dashes
		default:
			return false; // solid line for undefined
	}
}

/**
 * Get edge width based on strength
 */
export function getEdgeWidth(strength?: 'strong' | 'moderate' | 'weak'): number {
	switch (strength) {
		case 'strong':
			return 3;
		case 'moderate':
			return 2;
		case 'weak':
			return 1;
		default:
			return 2; // default width
	}
}
