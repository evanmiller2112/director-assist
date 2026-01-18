/**
 * Tests for Network Graph Utility Functions
 *
 * Issue #74: Network Diagram Visualization
 * RED Phase (TDD): These tests define expected behavior before implementation.
 *
 * Tests utility functions that convert RelationshipMap data to vis.js network format,
 * calculate node shapes and colors, and configure edge styling based on relationship strength.
 *
 * These tests should FAIL until the implementation is complete.
 */

import { describe, it, expect } from 'vitest';
import {
	getNodeShape,
	getEntityColor,
	toVisNetworkData,
	getEdgeDashes,
	getEdgeWidth
} from './networkGraph';
import type { RelationshipMap } from '$lib/db/repositories/entityRepository';
import type { NetworkDisplayOptions } from '$lib/types/network';
import type { EntityType } from '$lib/types';

describe('networkGraph - getNodeShape', () => {
	it('should return circle for character type', () => {
		const shape = getNodeShape('character');
		expect(shape).toBe('circle');
	});

	it('should return circle for npc type', () => {
		const shape = getNodeShape('npc');
		expect(shape).toBe('circle');
	});

	it('should return square for location type', () => {
		const shape = getNodeShape('location');
		expect(shape).toBe('square');
	});

	it('should return hexagon for faction type', () => {
		const shape = getNodeShape('faction');
		expect(shape).toBe('hexagon');
	});

	it('should return diamond for item type', () => {
		const shape = getNodeShape('item');
		expect(shape).toBe('diamond');
	});

	it('should return star for encounter type', () => {
		const shape = getNodeShape('encounter');
		expect(shape).toBe('star');
	});

	it('should return star for session type', () => {
		const shape = getNodeShape('session');
		expect(shape).toBe('star');
	});

	it('should return triangle for deity type', () => {
		const shape = getNodeShape('deity');
		expect(shape).toBe('triangle');
	});

	it('should return box for timeline_event type', () => {
		const shape = getNodeShape('timeline_event');
		expect(shape).toBe('box');
	});

	it('should return ellipse for world_rule type', () => {
		const shape = getNodeShape('world_rule');
		expect(shape).toBe('ellipse');
	});

	it('should return circle for player_profile type', () => {
		const shape = getNodeShape('player_profile');
		expect(shape).toBe('circle');
	});

	it('should return ellipse for campaign type', () => {
		const shape = getNodeShape('campaign');
		expect(shape).toBe('ellipse');
	});

	it('should return circle as default for unknown type', () => {
		const shape = getNodeShape('unknown_type' as EntityType);
		expect(shape).toBe('circle');
	});

	it('should return circle as default for custom entity type', () => {
		const shape = getNodeShape('custom_entity' as EntityType);
		expect(shape).toBe('circle');
	});
});

describe('networkGraph - getEntityColor', () => {
	describe('light mode colors', () => {
		it('should return correct color for character in light mode', () => {
			const color = getEntityColor('character', false);
			expect(color).toBe('#3b82f6');
		});

		it('should return correct color for npc in light mode', () => {
			const color = getEntityColor('npc', false);
			expect(color).toBe('#22c55e');
		});

		it('should return correct color for location in light mode', () => {
			const color = getEntityColor('location', false);
			expect(color).toBe('#f59e0b');
		});

		it('should return correct color for faction in light mode', () => {
			const color = getEntityColor('faction', false);
			expect(color).toBe('#a855f7');
		});

		it('should return correct color for item in light mode', () => {
			const color = getEntityColor('item', false);
			expect(color).toBe('#f97316');
		});

		it('should return correct color for encounter in light mode', () => {
			const color = getEntityColor('encounter', false);
			expect(color).toBe('#ef4444');
		});

		it('should return correct color for session in light mode', () => {
			const color = getEntityColor('session', false);
			expect(color).toBe('#06b6d4');
		});

		it('should return correct color for deity in light mode', () => {
			const color = getEntityColor('deity', false);
			expect(color).toBe('#eab308');
		});

		it('should return correct color for timeline_event in light mode', () => {
			const color = getEntityColor('timeline_event', false);
			expect(color).toBe('#64748b');
		});

		it('should return correct color for world_rule in light mode', () => {
			const color = getEntityColor('world_rule', false);
			expect(color).toBe('#6366f1');
		});

		it('should return correct color for player_profile in light mode', () => {
			const color = getEntityColor('player_profile', false);
			expect(color).toBe('#ec4899');
		});

		it('should return correct color for campaign in light mode', () => {
			const color = getEntityColor('campaign', false);
			expect(color).toBe('#8b5cf6');
		});
	});

	describe('dark mode colors', () => {
		it('should return correct color for character in dark mode', () => {
			const color = getEntityColor('character', true);
			expect(color).toBe('#1d4ed8');
		});

		it('should return correct color for npc in dark mode', () => {
			const color = getEntityColor('npc', true);
			expect(color).toBe('#15803d');
		});

		it('should return correct color for location in dark mode', () => {
			const color = getEntityColor('location', true);
			expect(color).toBe('#b45309');
		});

		it('should return correct color for faction in dark mode', () => {
			const color = getEntityColor('faction', true);
			expect(color).toBe('#7c3aed');
		});

		it('should return correct color for item in dark mode', () => {
			const color = getEntityColor('item', true);
			expect(color).toBe('#c2410c');
		});

		it('should return correct color for encounter in dark mode', () => {
			const color = getEntityColor('encounter', true);
			expect(color).toBe('#b91c1c');
		});

		it('should return correct color for session in dark mode', () => {
			const color = getEntityColor('session', true);
			expect(color).toBe('#0891b2');
		});

		it('should return correct color for deity in dark mode', () => {
			const color = getEntityColor('deity', true);
			expect(color).toBe('#a16207');
		});

		it('should return correct color for timeline_event in dark mode', () => {
			const color = getEntityColor('timeline_event', true);
			expect(color).toBe('#475569');
		});

		it('should return correct color for world_rule in dark mode', () => {
			const color = getEntityColor('world_rule', true);
			expect(color).toBe('#4f46e5');
		});

		it('should return correct color for player_profile in dark mode', () => {
			const color = getEntityColor('player_profile', true);
			expect(color).toBe('#be185d');
		});

		it('should return correct color for campaign in dark mode', () => {
			const color = getEntityColor('campaign', true);
			expect(color).toBe('#6d28d9');
		});
	});

	describe('default colors for unknown types', () => {
		it('should return default light color for unknown entity type', () => {
			const color = getEntityColor('unknown_type' as EntityType, false);
			expect(color).toBe('#9ca3af'); // gray-400
		});

		it('should return default dark color for unknown entity type in dark mode', () => {
			const color = getEntityColor('unknown_type' as EntityType, true);
			expect(color).toBe('#6b7280'); // gray-500
		});
	});
});

describe('networkGraph - getEdgeDashes', () => {
	it('should return false (solid line) for strong relationship', () => {
		const dashes = getEdgeDashes('strong');
		expect(dashes).toBe(false);
	});

	it('should return dash array for moderate relationship', () => {
		const dashes = getEdgeDashes('moderate');
		expect(dashes).toEqual([5, 5]);
	});

	it('should return dash array for weak relationship', () => {
		const dashes = getEdgeDashes('weak');
		expect(dashes).toEqual([2, 4]);
	});

	it('should return false (solid line) for undefined strength', () => {
		const dashes = getEdgeDashes(undefined);
		expect(dashes).toBe(false);
	});

	it('should return false (solid line) when no strength provided', () => {
		const dashes = getEdgeDashes();
		expect(dashes).toBe(false);
	});
});

describe('networkGraph - getEdgeWidth', () => {
	it('should return width 3 for strong relationship', () => {
		const width = getEdgeWidth('strong');
		expect(width).toBe(3);
	});

	it('should return width 2 for moderate relationship', () => {
		const width = getEdgeWidth('moderate');
		expect(width).toBe(2);
	});

	it('should return width 1 for weak relationship', () => {
		const width = getEdgeWidth('weak');
		expect(width).toBe(1);
	});

	it('should return default width 2 for undefined strength', () => {
		const width = getEdgeWidth(undefined);
		expect(width).toBe(2);
	});

	it('should return default width 2 when no strength provided', () => {
		const width = getEdgeWidth();
		expect(width).toBe(2);
	});
});

describe('networkGraph - toVisNetworkData', () => {
	describe('basic conversion', () => {
		it('should convert empty RelationshipMap to vis.js DataSet format', () => {
			const map: RelationshipMap = {
				nodes: [],
				edges: []
			};

			const options: NetworkDisplayOptions = {
				isDark: false
			};

			const result = toVisNetworkData(map, options);

			expect(result).toHaveProperty('nodes');
			expect(result).toHaveProperty('edges');
			expect(result.nodes.length).toBe(0);
			expect(result.edges.length).toBe(0);
		});

		it('should convert nodes to vis.js format with correct properties', () => {
			const map: RelationshipMap = {
				nodes: [
					{
						id: 'entity-1',
						type: 'character',
						name: 'Gandalf',
						linkCount: 5
					},
					{
						id: 'entity-2',
						type: 'location',
						name: 'Rivendell',
						linkCount: 3
					}
				],
				edges: []
			};

			const options: NetworkDisplayOptions = {
				isDark: false
			};

			const result = toVisNetworkData(map, options);

			expect(result.nodes.length).toBe(2);

			// Check first node
			const node1 = result.nodes.get('entity-1');
			expect(node1).toBeDefined();
			expect(node1.id).toBe('entity-1');
			expect(node1.label).toBe('Gandalf');
			expect(node1.shape).toBe('circle');
			expect(node1.color).toBe('#3b82f6');
			expect(node1.title).toContain('Gandalf');
			expect(node1.title).toContain('character');
			expect(node1.title).toContain('5 connections');

			// Check second node
			const node2 = result.nodes.get('entity-2');
			expect(node2).toBeDefined();
			expect(node2.id).toBe('entity-2');
			expect(node2.label).toBe('Rivendell');
			expect(node2.shape).toBe('square');
			expect(node2.color).toBe('#f59e0b');
		});

		it('should convert edges to vis.js format with correct properties', () => {
			const map: RelationshipMap = {
				nodes: [
					{ id: 'entity-1', type: 'character', name: 'Frodo', linkCount: 2 },
					{ id: 'entity-2', type: 'character', name: 'Sam', linkCount: 2 }
				],
				edges: [
					{
						id: 1,
						source: 'entity-1',
						target: 'entity-2',
						relationship: 'friend_of',
						bidirectional: true,
						strength: 'strong'
					}
				]
			};

			const options: NetworkDisplayOptions = {
				isDark: false
			};

			const result = toVisNetworkData(map, options);

			expect(result.edges.length).toBe(1);

			const edge = result.edges.get(1);
			expect(edge).toBeDefined();
			expect(edge.id).toBe(1);
			expect(edge.from).toBe('entity-1');
			expect(edge.to).toBe('entity-2');
			expect(edge.label).toBe('friend_of');
			expect(edge.arrows).toBe('to;from');
			expect(edge.width).toBe(3);
			expect(edge.dashes).toBe(false);
		});

		it('should handle unidirectional edges correctly', () => {
			const map: RelationshipMap = {
				nodes: [
					{ id: 'entity-1', type: 'character', name: 'Aragorn', linkCount: 1 },
					{ id: 'entity-2', type: 'location', name: 'Gondor', linkCount: 1 }
				],
				edges: [
					{
						id: 1,
						source: 'entity-1',
						target: 'entity-2',
						relationship: 'rules',
						bidirectional: false
					}
				]
			};

			const options: NetworkDisplayOptions = {
				isDark: false
			};

			const result = toVisNetworkData(map, options);

			const edge = result.edges.get(1);
			expect(edge).toBeDefined();
			expect(edge.arrows).toBe('to');
		});

		it('should apply dark mode colors when isDark is true', () => {
			const map: RelationshipMap = {
				nodes: [
					{ id: 'entity-1', type: 'character', name: 'Test', linkCount: 0 }
				],
				edges: []
			};

			const options: NetworkDisplayOptions = {
				isDark: true
			};

			const result = toVisNetworkData(map, options);

			const node = result.nodes.get('entity-1');
			expect(node.color).toBe('#1d4ed8'); // Dark mode character color
		});
	});

	describe('edge styling based on strength', () => {
		it('should apply strong edge styling', () => {
			const map: RelationshipMap = {
				nodes: [
					{ id: 'e1', type: 'character', name: 'A', linkCount: 1 },
					{ id: 'e2', type: 'character', name: 'B', linkCount: 1 }
				],
				edges: [
					{
						id: 1,
						source: 'e1',
						target: 'e2',
						relationship: 'allied',
						bidirectional: true,
						strength: 'strong'
					}
				]
			};

			const result = toVisNetworkData(map, { isDark: false });

			const edge = result.edges.get(1);
			expect(edge.width).toBe(3);
			expect(edge.dashes).toBe(false);
		});

		it('should apply moderate edge styling', () => {
			const map: RelationshipMap = {
				nodes: [
					{ id: 'e1', type: 'character', name: 'A', linkCount: 1 },
					{ id: 'e2', type: 'character', name: 'B', linkCount: 1 }
				],
				edges: [
					{
						id: 1,
						source: 'e1',
						target: 'e2',
						relationship: 'knows',
						bidirectional: true,
						strength: 'moderate'
					}
				]
			};

			const result = toVisNetworkData(map, { isDark: false });

			const edge = result.edges.get(1);
			expect(edge.width).toBe(2);
			expect(edge.dashes).toEqual([5, 5]);
		});

		it('should apply weak edge styling', () => {
			const map: RelationshipMap = {
				nodes: [
					{ id: 'e1', type: 'character', name: 'A', linkCount: 1 },
					{ id: 'e2', type: 'character', name: 'B', linkCount: 1 }
				],
				edges: [
					{
						id: 1,
						source: 'e1',
						target: 'e2',
						relationship: 'met_once',
						bidirectional: false,
						strength: 'weak'
					}
				]
			};

			const result = toVisNetworkData(map, { isDark: false });

			const edge = result.edges.get(1);
			expect(edge.width).toBe(1);
			expect(edge.dashes).toEqual([2, 4]);
		});
	});

	describe('multiple nodes and edges', () => {
		it('should handle complex graph with many entities', () => {
			const map: RelationshipMap = {
				nodes: [
					{ id: 'c1', type: 'character', name: 'Character 1', linkCount: 2 },
					{ id: 'c2', type: 'npc', name: 'NPC 1', linkCount: 2 },
					{ id: 'l1', type: 'location', name: 'Location 1', linkCount: 2 },
					{ id: 'f1', type: 'faction', name: 'Faction 1', linkCount: 1 }
				],
				edges: [
					{ id: 1, source: 'c1', target: 'c2', relationship: 'knows', bidirectional: true },
					{ id: 2, source: 'c1', target: 'l1', relationship: 'located_at', bidirectional: false },
					{ id: 3, source: 'c2', target: 'l1', relationship: 'located_at', bidirectional: false },
					{ id: 4, source: 'f1', target: 'l1', relationship: 'headquartered_at', bidirectional: false }
				]
			};

			const result = toVisNetworkData(map, { isDark: false });

			expect(result.nodes.length).toBe(4);
			expect(result.edges.length).toBe(4);

			// Verify all nodes have correct shapes
			expect(result.nodes.get('c1').shape).toBe('circle');
			expect(result.nodes.get('c2').shape).toBe('circle');
			expect(result.nodes.get('l1').shape).toBe('square');
			expect(result.nodes.get('f1').shape).toBe('hexagon');
		});
	});

	describe('node tooltips', () => {
		it('should include entity type and connection count in tooltip', () => {
			const map: RelationshipMap = {
				nodes: [
					{ id: 'e1', type: 'character', name: 'Hero', linkCount: 10 }
				],
				edges: []
			};

			const result = toVisNetworkData(map, { isDark: false });

			const node = result.nodes.get('e1');
			expect(node.title).toBe('Hero\nType: character\nConnections: 10');
		});

		it('should handle singular connection in tooltip', () => {
			const map: RelationshipMap = {
				nodes: [
					{ id: 'e1', type: 'item', name: 'Sword', linkCount: 1 }
				],
				edges: []
			};

			const result = toVisNetworkData(map, { isDark: false });

			const node = result.nodes.get('e1');
			expect(node.title).toBe('Sword\nType: item\nConnections: 1');
		});

		it('should handle zero connections in tooltip', () => {
			const map: RelationshipMap = {
				nodes: [
					{ id: 'e1', type: 'location', name: 'Remote Cave', linkCount: 0 }
				],
				edges: []
			};

			const result = toVisNetworkData(map, { isDark: false });

			const node = result.nodes.get('e1');
			expect(node.title).toBe('Remote Cave\nType: location\nConnections: 0');
		});
	});

	describe('DataSet type validation', () => {
		it('should return DataSet instances', () => {
			const map: RelationshipMap = {
				nodes: [{ id: 'e1', type: 'character', name: 'Test', linkCount: 0 }],
				edges: []
			};

			const result = toVisNetworkData(map, { isDark: false });

			// DataSet has specific methods
			expect(result.nodes.add).toBeDefined();
			expect(result.nodes.get).toBeDefined();
			expect(result.nodes.update).toBeDefined();
			expect(result.nodes.remove).toBeDefined();

			expect(result.edges.add).toBeDefined();
			expect(result.edges.get).toBeDefined();
			expect(result.edges.update).toBeDefined();
			expect(result.edges.remove).toBeDefined();
		});

		it('should allow DataSet operations on returned nodes', () => {
			const map: RelationshipMap = {
				nodes: [{ id: 'e1', type: 'character', name: 'Test', linkCount: 0 }],
				edges: []
			};

			const result = toVisNetworkData(map, { isDark: false });

			// Should be able to get by ID
			const node = result.nodes.get('e1');
			expect(node).toBeDefined();

			// Should be able to get all
			const allNodes = result.nodes.get();
			expect(Array.isArray(allNodes)).toBe(true);
			expect(allNodes.length).toBe(1);
		});
	});

	describe('edge cases', () => {
		it('should handle nodes with very long names', () => {
			const map: RelationshipMap = {
				nodes: [
					{
						id: 'e1',
						type: 'character',
						name: 'A'.repeat(100),
						linkCount: 0
					}
				],
				edges: []
			};

			const result = toVisNetworkData(map, { isDark: false });

			const node = result.nodes.get('e1');
			expect(node.label).toBe('A'.repeat(100));
		});

		it('should handle relationship names with special characters', () => {
			const map: RelationshipMap = {
				nodes: [
					{ id: 'e1', type: 'character', name: 'A', linkCount: 1 },
					{ id: 'e2', type: 'character', name: 'B', linkCount: 1 }
				],
				edges: [
					{
						id: 1,
						source: 'e1',
						target: 'e2',
						relationship: 'friend-of/ally',
						bidirectional: true
					}
				]
			};

			const result = toVisNetworkData(map, { isDark: false });

			const edge = result.edges.get(1);
			expect(edge.label).toBe('friend-of/ally');
		});

		it('should handle edges without strength property', () => {
			const map: RelationshipMap = {
				nodes: [
					{ id: 'e1', type: 'character', name: 'A', linkCount: 1 },
					{ id: 'e2', type: 'character', name: 'B', linkCount: 1 }
				],
				edges: [
					{
						id: 1,
						source: 'e1',
						target: 'e2',
						relationship: 'knows',
						bidirectional: false
					}
				]
			};

			const result = toVisNetworkData(map, { isDark: false });

			const edge = result.edges.get(1);
			expect(edge.width).toBe(2); // Default width
			expect(edge.dashes).toBe(false); // Default dashes
		});
	});
});
