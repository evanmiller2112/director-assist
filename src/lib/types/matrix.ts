/**
 * Type definitions for the Relationship Matrix View feature.
 *
 * Issue #73: Relationship Matrix View
 *
 * The matrix view provides a 2D grid visualization of relationships between entities,
 * where rows and columns represent different entity types (or the same type), and
 * cells show the relationships between them.
 */

import type { EntityType } from './entities';
import type { RelationshipMapNode, RelationshipMapEdge } from '$lib/db/repositories/entityRepository';

/**
 * Options for filtering the relationship matrix.
 *
 * Controls which entities appear in rows/columns and which relationships are displayed.
 */
export interface MatrixFilterOptions {
	/** Entity type to display in matrix rows */
	rowEntityType: EntityType;
	/** Entity type to display in matrix columns */
	columnEntityType: EntityType;
	/** Optional filter to show only specific relationship type */
	relationshipType?: string;
	/** Hide rows that have no relationships */
	hideEmptyRows?: boolean;
	/** Hide columns that have no relationships */
	hideEmptyColumns?: boolean;
}

/**
 * Options for sorting matrix rows and columns.
 *
 * Supports alphabetical sorting by entity name or by connection count.
 */
export interface MatrixSortOptions {
	/** How to sort rows */
	rowSort: 'alphabetical' | 'connectionCount';
	/** How to sort columns */
	columnSort: 'alphabetical' | 'connectionCount';
	/** Sort direction for rows */
	rowDirection: 'asc' | 'desc';
	/** Sort direction for columns */
	columnDirection: 'asc' | 'desc';
}

/**
 * Data for a single cell in the relationship matrix.
 *
 * Each cell represents the relationships between a row entity and column entity.
 */
export interface MatrixCellData {
	/** ID of the row entity */
	rowEntityId: string;
	/** ID of the column entity */
	columnEntityId: string;
	/** All relationships between these two entities (may be bidirectional or unidirectional) */
	relationships: RelationshipMapEdge[];
	/** Total count of relationships in this cell */
	count: number;
}

/**
 * Complete data structure for the relationship matrix.
 *
 * Contains the filtered and sorted entities for rows/columns, the cell data map,
 * and metadata about available relationship types.
 */
export interface MatrixData {
	/** Entities displayed in matrix rows (filtered and sorted) */
	rowEntities: RelationshipMapNode[];
	/** Entities displayed in matrix columns (filtered and sorted) */
	columnEntities: RelationshipMapNode[];
	/** Map of cell data, keyed by "{rowEntityId}-{columnEntityId}" */
	cells: Map<string, MatrixCellData>;
	/** All unique relationship types found in the filtered data */
	relationshipTypes: string[];
}
