/**
 * Utility functions for the Relationship Matrix View.
 *
 * Issue #73: Relationship Matrix View
 *
 * These functions handle the core data transformations for the matrix view:
 * - Building cell data from relationship maps
 * - Filtering entities and relationships
 * - Sorting matrix rows and columns
 * - Generating consistent cell keys
 */

import type {
	RelationshipMap,
	RelationshipMapNode,
	RelationshipMapEdge
} from '$lib/db/repositories/entityRepository';
import type {
	MatrixFilterOptions,
	MatrixSortOptions,
	MatrixData,
	MatrixCellData
} from '$lib/types/matrix';

/**
 * Generates a consistent key for a matrix cell.
 *
 * The key format is: "{rowId}-{columnId}"
 * This allows efficient lookup and storage of cell data.
 *
 * @param rowId - The ID of the row entity
 * @param colId - The ID of the column entity
 * @returns A consistent string key for the cell
 *
 * @example
 * getCellKey('char1', 'loc1') // Returns 'char1-loc1'
 * getCellKey('char2', 'char1') // Returns 'char2-char1' (different from 'char1-char2')
 */
export function getCellKey(rowId: string, colId: string): string {
	return `${rowId}-${colId}`;
}

/**
 * Finds all relationships between two entities, regardless of direction.
 *
 * This function handles:
 * - Relationships from A to B
 * - Relationships from B to A
 * - Bidirectional relationships
 * - Self-referencing relationships
 *
 * @param edges - Array of all relationship edges
 * @param entityAId - ID of the first entity
 * @param entityBId - ID of the second entity
 * @returns Array of all relationships between the two entities
 *
 * @example
 * // Find all relationships between char1 and char2
 * const rels = getRelationshipsBetween(edges, 'char1', 'char2');
 * // Returns relationships where:
 * // - source=char1, target=char2
 * // - source=char2, target=char1
 */
export function getRelationshipsBetween(
	edges: RelationshipMapEdge[],
	entityAId: string,
	entityBId: string
): RelationshipMapEdge[] {
	return edges.filter((edge) => {
		// Check if this edge connects the two entities in either direction
		return (
			(edge.source === entityAId && edge.target === entityBId) ||
			(edge.source === entityBId && edge.target === entityAId)
		);
	});
}

/**
 * Builds the matrix data structure from a relationship map with filtering.
 *
 * This function:
 * 1. Filters nodes by row and column entity types
 * 2. Builds cells from relationships between filtered entities
 * 3. Extracts unique relationship types
 * 4. Applies empty row/column filtering if requested
 *
 * @param relationshipMap - The complete relationship map
 * @param filterOptions - Options for filtering the matrix
 * @returns The filtered matrix data structure
 *
 * @example
 * const matrixData = buildMatrixData(relationshipMap, {
 *   rowEntityType: 'character',
 *   columnEntityType: 'location',
 *   relationshipType: 'located_at',
 *   hideEmptyRows: true
 * });
 */
export function buildMatrixData(
	relationshipMap: RelationshipMap,
	filterOptions: MatrixFilterOptions
): MatrixData {
	// Filter nodes by entity type for rows and columns
	let rowEntities = relationshipMap.nodes.filter(
		(node) => node.type === filterOptions.rowEntityType
	);
	let columnEntities = relationshipMap.nodes.filter(
		(node) => node.type === filterOptions.columnEntityType
	);

	// Filter edges by relationship type if specified
	let filteredEdges = relationshipMap.edges;
	if (filterOptions.relationshipType) {
		filteredEdges = filteredEdges.filter(
			(edge) => edge.relationship === filterOptions.relationshipType
		);
	}

	// Build cells map
	const cells = new Map<string, MatrixCellData>();

	// Create a Set to track which row/column entities have relationships
	const rowsWithRelationships = new Set<string>();
	const columnsWithRelationships = new Set<string>();

	// Process each combination of row and column entities
	for (const rowEntity of rowEntities) {
		for (const columnEntity of columnEntities) {
			const relationships = getRelationshipsBetween(
				filteredEdges,
				rowEntity.id,
				columnEntity.id
			);

			if (relationships.length > 0) {
				const cellKey = getCellKey(rowEntity.id, columnEntity.id);
				cells.set(cellKey, {
					rowEntityId: rowEntity.id,
					columnEntityId: columnEntity.id,
					relationships,
					count: relationships.length
				});

				// Track entities with relationships
				rowsWithRelationships.add(rowEntity.id);
				columnsWithRelationships.add(columnEntity.id);
			}
		}
	}

	// Apply empty row/column filtering
	if (filterOptions.hideEmptyRows) {
		rowEntities = rowEntities.filter((entity) => rowsWithRelationships.has(entity.id));
	}

	if (filterOptions.hideEmptyColumns) {
		columnEntities = columnEntities.filter((entity) => columnsWithRelationships.has(entity.id));
	}

	// Extract unique relationship types from filtered edges
	const relationshipTypesSet = new Set<string>();
	filteredEdges.forEach((edge) => {
		relationshipTypesSet.add(edge.relationship);
	});
	const relationshipTypes = Array.from(relationshipTypesSet);

	return {
		rowEntities,
		columnEntities,
		cells,
		relationshipTypes
	};
}

/**
 * Sorts the matrix data based on sort options.
 *
 * This function:
 * 1. Sorts row entities based on rowSort option (alphabetical or connectionCount)
 * 2. Sorts column entities based on columnSort option
 * 3. Handles ascending/descending direction for each
 * 4. Returns a new MatrixData object (doesn't mutate the original)
 *
 * @param matrixData - The matrix data to sort
 * @param sortOptions - Options specifying how to sort rows and columns
 * @returns A new MatrixData object with sorted entities
 *
 * @example
 * const sorted = sortMatrixData(matrixData, {
 *   rowSort: 'alphabetical',
 *   columnSort: 'connectionCount',
 *   rowDirection: 'asc',
 *   columnDirection: 'desc'
 * });
 */
export function sortMatrixData(matrixData: MatrixData, sortOptions: MatrixSortOptions): MatrixData {
	// Create comparison function for row sorting
	const rowCompareFn = createCompareFn(sortOptions.rowSort, sortOptions.rowDirection);

	// Create comparison function for column sorting
	const columnCompareFn = createCompareFn(sortOptions.columnSort, sortOptions.columnDirection);

	// Sort entities (create new arrays to avoid mutation)
	const sortedRowEntities = [...matrixData.rowEntities].sort(rowCompareFn);
	const sortedColumnEntities = [...matrixData.columnEntities].sort(columnCompareFn);

	// Return new MatrixData object with sorted entities
	return {
		rowEntities: sortedRowEntities,
		columnEntities: sortedColumnEntities,
		cells: matrixData.cells,
		relationshipTypes: matrixData.relationshipTypes
	};
}

/**
 * Creates a comparison function for sorting entities.
 *
 * @param sortBy - Sort by 'alphabetical' or 'connectionCount'
 * @param direction - Sort direction 'asc' or 'desc'
 * @returns A comparison function for Array.sort()
 */
function createCompareFn(
	sortBy: 'alphabetical' | 'connectionCount',
	direction: 'asc' | 'desc'
): (a: RelationshipMapNode, b: RelationshipMapNode) => number {
	return (a: RelationshipMapNode, b: RelationshipMapNode) => {
		let comparison = 0;

		if (sortBy === 'alphabetical') {
			// Case-insensitive alphabetical comparison
			comparison = a.name.toLowerCase().localeCompare(b.name.toLowerCase());
		} else if (sortBy === 'connectionCount') {
			// Numeric comparison
			comparison = a.linkCount - b.linkCount;
		}

		// Reverse comparison for descending order
		return direction === 'desc' ? -comparison : comparison;
	};
}
