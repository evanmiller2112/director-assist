/**
 * Type definitions for Network Diagram Visualization
 *
 * Issue #74: Network Diagram Visualization
 *
 * These types define the data structures for the network graph visualization
 * using vis.js network library.
 */

import type { EntityType } from './entities';

/**
 * Display options for the network diagram
 */
export interface NetworkDisplayOptions {
	/** Whether to use dark mode colors */
	isDark: boolean;
	/** Whether to show node labels */
	showLabels?: boolean;
	/** Physics simulation enabled */
	physicsEnabled?: boolean;
}

/**
 * Filter options for the network diagram
 */
export interface NetworkFilterOptions {
	/** Entity types to display */
	entityTypes?: EntityType[];
	/** Relationship types to display */
	relationshipTypes?: string[];
	/** Minimum relationship strength */
	minStrength?: 'weak' | 'moderate' | 'strong';
}

/**
 * Selected node data for detail display
 */
export interface SelectedNode {
	id: string;
	name: string;
	type: EntityType;
	linkCount: number;
}

/**
 * Selected edge data for detail display
 */
export interface SelectedEdge {
	id: number;
	source: string;
	target: string;
	sourceName: string;
	targetName: string;
	relationship: string;
	bidirectional: boolean;
	strength?: 'strong' | 'moderate' | 'weak';
}
