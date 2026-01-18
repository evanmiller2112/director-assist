import { describe, it, expect } from 'vitest';
import {
	buildMatrixData,
	sortMatrixData,
	getCellKey,
	getRelationshipsBetween
} from './matrixUtils';
import type { RelationshipMap, RelationshipMapNode, RelationshipMapEdge } from '$lib/db/repositories/entityRepository';
import type { MatrixFilterOptions, MatrixSortOptions } from '$lib/types/matrix';

/**
 * Tests for Relationship Matrix View Utilities
 *
 * Issue #73: Relationship Matrix View
 *
 * This test suite covers the core utility functions for the matrix view feature.
 * These tests are written in the RED phase of TDD - they will FAIL until the
 * implementation is created.
 *
 * Testing Strategy:
 * - Test each function in isolation with comprehensive scenarios
 * - Cover happy paths, edge cases, and error conditions
 * - Test filtering, sorting, and data transformation logic
 * - Ensure proper handling of bidirectional relationships
 * - Validate cell key generation and relationship lookup
 */

// Test Data Fixtures

/**
 * Creates a basic RelationshipMapNode for testing.
 */
function createNode(
	id: string,
	type: 'character' | 'location' | 'faction' | 'item',
	name: string,
	linkCount = 0
): RelationshipMapNode {
	return {
		id,
		type,
		name,
		linkCount
	};
}

/**
 * Creates a basic RelationshipMapEdge for testing.
 */
function createEdge(
	id: number,
	source: string,
	target: string,
	relationship: string,
	bidirectional = false
): RelationshipMapEdge {
	return {
		id,
		source,
		target,
		relationship,
		bidirectional
	};
}

// getCellKey() Tests

describe('getCellKey - Cell Key Generation', () => {
	it('should generate consistent key format from row and column IDs', () => {
		const key = getCellKey('entity1', 'entity2');
		expect(key).toBe('entity1-entity2');
	});

	it('should generate different keys for different row IDs', () => {
		const key1 = getCellKey('entity1', 'entity2');
		const key2 = getCellKey('entity3', 'entity2');
		expect(key1).not.toBe(key2);
	});

	it('should generate different keys for different column IDs', () => {
		const key1 = getCellKey('entity1', 'entity2');
		const key2 = getCellKey('entity1', 'entity3');
		expect(key1).not.toBe(key2);
	});

	it('should generate different keys for swapped row and column IDs', () => {
		const key1 = getCellKey('entity1', 'entity2');
		const key2 = getCellKey('entity2', 'entity1');
		expect(key1).not.toBe(key2);
	});

	it('should handle IDs with special characters', () => {
		const key = getCellKey('entity-1_abc', 'entity-2_xyz');
		expect(key).toBe('entity-1_abc-entity-2_xyz');
	});

	it('should handle empty string IDs', () => {
		const key = getCellKey('', '');
		expect(key).toBe('-');
	});

	it('should generate consistent keys for same inputs', () => {
		const key1 = getCellKey('entity1', 'entity2');
		const key2 = getCellKey('entity1', 'entity2');
		expect(key1).toBe(key2);
	});
});

// getRelationshipsBetween() Tests

describe('getRelationshipsBetween - Bidirectional Relationship Lookup', () => {
	it('should find relationships from A to B', () => {
		const edges: RelationshipMapEdge[] = [
			createEdge(1, 'char1', 'char2', 'knows', false)
		];

		const result = getRelationshipsBetween(edges, 'char1', 'char2');
		expect(result).toHaveLength(1);
		expect(result[0].source).toBe('char1');
		expect(result[0].target).toBe('char2');
	});

	it('should find relationships from B to A', () => {
		const edges: RelationshipMapEdge[] = [
			createEdge(1, 'char2', 'char1', 'knows', false)
		];

		const result = getRelationshipsBetween(edges, 'char1', 'char2');
		expect(result).toHaveLength(1);
		expect(result[0].source).toBe('char2');
		expect(result[0].target).toBe('char1');
	});

	it('should find multiple relationships between same entities', () => {
		const edges: RelationshipMapEdge[] = [
			createEdge(1, 'char1', 'char2', 'knows', false),
			createEdge(2, 'char1', 'char2', 'works_with', false),
			createEdge(3, 'char2', 'char1', 'trusts', false)
		];

		const result = getRelationshipsBetween(edges, 'char1', 'char2');
		expect(result).toHaveLength(3);
	});

	it('should find bidirectional relationships', () => {
		const edges: RelationshipMapEdge[] = [
			createEdge(1, 'char1', 'char2', 'friends', true)
		];

		const result = getRelationshipsBetween(edges, 'char1', 'char2');
		expect(result).toHaveLength(1);
		expect(result[0].bidirectional).toBe(true);
	});

	it('should return empty array when no relationships exist', () => {
		const edges: RelationshipMapEdge[] = [
			createEdge(1, 'char1', 'char3', 'knows', false),
			createEdge(2, 'char2', 'char4', 'knows', false)
		];

		const result = getRelationshipsBetween(edges, 'char1', 'char2');
		expect(result).toHaveLength(0);
	});

	it('should return empty array for empty edges array', () => {
		const result = getRelationshipsBetween([], 'char1', 'char2');
		expect(result).toHaveLength(0);
	});

	it('should not match partial entity IDs', () => {
		const edges: RelationshipMapEdge[] = [
			createEdge(1, 'char1', 'char12', 'knows', false)
		];

		const result = getRelationshipsBetween(edges, 'char1', 'char2');
		expect(result).toHaveLength(0);
	});

	it('should handle self-referencing relationships', () => {
		const edges: RelationshipMapEdge[] = [
			createEdge(1, 'char1', 'char1', 'self_reflection', false)
		];

		const result = getRelationshipsBetween(edges, 'char1', 'char1');
		expect(result).toHaveLength(1);
		expect(result[0].source).toBe('char1');
		expect(result[0].target).toBe('char1');
	});
});

// buildMatrixData() Tests

describe('buildMatrixData - Basic Functionality', () => {
	it('should build matrix data for simple character-to-character relationships', () => {
		const relationshipMap: RelationshipMap = {
			nodes: [
				createNode('char1', 'character', 'Alice', 1),
				createNode('char2', 'character', 'Bob', 1)
			],
			edges: [
				createEdge(1, 'char1', 'char2', 'knows', false)
			]
		};

		const filterOptions: MatrixFilterOptions = {
			rowEntityType: 'character',
			columnEntityType: 'character'
		};

		const result = buildMatrixData(relationshipMap, filterOptions);

		expect(result.rowEntities).toHaveLength(2);
		expect(result.columnEntities).toHaveLength(2);
		expect(result.cells.size).toBeGreaterThan(0);
		expect(result.relationshipTypes).toContain('knows');
	});

	it('should filter row entities by entity type', () => {
		const relationshipMap: RelationshipMap = {
			nodes: [
				createNode('char1', 'character', 'Alice'),
				createNode('loc1', 'location', 'Tavern'),
				createNode('fact1', 'faction', 'Thieves Guild')
			],
			edges: []
		};

		const filterOptions: MatrixFilterOptions = {
			rowEntityType: 'character',
			columnEntityType: 'location'
		};

		const result = buildMatrixData(relationshipMap, filterOptions);

		expect(result.rowEntities).toHaveLength(1);
		expect(result.rowEntities[0].type).toBe('character');
	});

	it('should filter column entities by entity type', () => {
		const relationshipMap: RelationshipMap = {
			nodes: [
				createNode('char1', 'character', 'Alice'),
				createNode('loc1', 'location', 'Tavern'),
				createNode('loc2', 'location', 'Castle')
			],
			edges: []
		};

		const filterOptions: MatrixFilterOptions = {
			rowEntityType: 'character',
			columnEntityType: 'location'
		};

		const result = buildMatrixData(relationshipMap, filterOptions);

		expect(result.columnEntities).toHaveLength(2);
		expect(result.columnEntities.every(e => e.type === 'location')).toBe(true);
	});

	it('should create cells for relationships between filtered entities', () => {
		const relationshipMap: RelationshipMap = {
			nodes: [
				createNode('char1', 'character', 'Alice'),
				createNode('loc1', 'location', 'Tavern')
			],
			edges: [
				createEdge(1, 'char1', 'loc1', 'located_at', false)
			]
		};

		const filterOptions: MatrixFilterOptions = {
			rowEntityType: 'character',
			columnEntityType: 'location'
		};

		const result = buildMatrixData(relationshipMap, filterOptions);

		const cellKey = getCellKey('char1', 'loc1');
		const cell = result.cells.get(cellKey);

		expect(cell).toBeDefined();
		expect(cell?.relationships).toHaveLength(1);
		expect(cell?.count).toBe(1);
	});

	it('should extract all unique relationship types', () => {
		const relationshipMap: RelationshipMap = {
			nodes: [
				createNode('char1', 'character', 'Alice'),
				createNode('char2', 'character', 'Bob'),
				createNode('char3', 'character', 'Charlie')
			],
			edges: [
				createEdge(1, 'char1', 'char2', 'knows', false),
				createEdge(2, 'char1', 'char3', 'trusts', false),
				createEdge(3, 'char2', 'char3', 'knows', false)
			]
		};

		const filterOptions: MatrixFilterOptions = {
			rowEntityType: 'character',
			columnEntityType: 'character'
		};

		const result = buildMatrixData(relationshipMap, filterOptions);

		expect(result.relationshipTypes).toContain('knows');
		expect(result.relationshipTypes).toContain('trusts');
		expect(result.relationshipTypes).toHaveLength(2);
	});
});

describe('buildMatrixData - Same Entity Type Matrices', () => {
	it('should build matrix when rows and columns are the same entity type', () => {
		const relationshipMap: RelationshipMap = {
			nodes: [
				createNode('char1', 'character', 'Alice'),
				createNode('char2', 'character', 'Bob')
			],
			edges: [
				createEdge(1, 'char1', 'char2', 'knows', false)
			]
		};

		const filterOptions: MatrixFilterOptions = {
			rowEntityType: 'character',
			columnEntityType: 'character'
		};

		const result = buildMatrixData(relationshipMap, filterOptions);

		expect(result.rowEntities).toEqual(result.columnEntities);
	});

	it('should handle diagonal cells for same-type matrices', () => {
		const relationshipMap: RelationshipMap = {
			nodes: [
				createNode('char1', 'character', 'Alice'),
				createNode('char2', 'character', 'Bob')
			],
			edges: [
				createEdge(1, 'char1', 'char1', 'self_reflection', false)
			]
		};

		const filterOptions: MatrixFilterOptions = {
			rowEntityType: 'character',
			columnEntityType: 'character'
		};

		const result = buildMatrixData(relationshipMap, filterOptions);

		const cellKey = getCellKey('char1', 'char1');
		const cell = result.cells.get(cellKey);

		expect(cell).toBeDefined();
		expect(cell?.rowEntityId).toBe('char1');
		expect(cell?.columnEntityId).toBe('char1');
	});
});

describe('buildMatrixData - Bidirectional Relationships', () => {
	it('should handle bidirectional relationships correctly', () => {
		const relationshipMap: RelationshipMap = {
			nodes: [
				createNode('char1', 'character', 'Alice'),
				createNode('char2', 'character', 'Bob')
			],
			edges: [
				createEdge(1, 'char1', 'char2', 'friends', true)
			]
		};

		const filterOptions: MatrixFilterOptions = {
			rowEntityType: 'character',
			columnEntityType: 'character'
		};

		const result = buildMatrixData(relationshipMap, filterOptions);

		const cell1 = result.cells.get(getCellKey('char1', 'char2'));
		const cell2 = result.cells.get(getCellKey('char2', 'char1'));

		// Both cells should exist and contain the same relationship
		expect(cell1).toBeDefined();
		expect(cell2).toBeDefined();
		expect(cell1?.relationships[0]?.bidirectional).toBe(true);
		expect(cell2?.relationships[0]?.bidirectional).toBe(true);
	});

	it('should count multiple relationships between same entities', () => {
		const relationshipMap: RelationshipMap = {
			nodes: [
				createNode('char1', 'character', 'Alice'),
				createNode('char2', 'character', 'Bob')
			],
			edges: [
				createEdge(1, 'char1', 'char2', 'knows', false),
				createEdge(2, 'char1', 'char2', 'trusts', false),
				createEdge(3, 'char2', 'char1', 'respects', false)
			]
		};

		const filterOptions: MatrixFilterOptions = {
			rowEntityType: 'character',
			columnEntityType: 'character'
		};

		const result = buildMatrixData(relationshipMap, filterOptions);

		const cell = result.cells.get(getCellKey('char1', 'char2'));
		expect(cell?.count).toBe(3);
		expect(cell?.relationships).toHaveLength(3);
	});
});

describe('buildMatrixData - Relationship Type Filtering', () => {
	it('should filter cells by specific relationship type', () => {
		const relationshipMap: RelationshipMap = {
			nodes: [
				createNode('char1', 'character', 'Alice'),
				createNode('char2', 'character', 'Bob'),
				createNode('char3', 'character', 'Charlie')
			],
			edges: [
				createEdge(1, 'char1', 'char2', 'knows', false),
				createEdge(2, 'char1', 'char3', 'trusts', false),
				createEdge(3, 'char2', 'char3', 'knows', false)
			]
		};

		const filterOptions: MatrixFilterOptions = {
			rowEntityType: 'character',
			columnEntityType: 'character',
			relationshipType: 'knows'
		};

		const result = buildMatrixData(relationshipMap, filterOptions);

		// Check that only 'knows' relationships are in cells
		result.cells.forEach(cell => {
			cell.relationships.forEach(rel => {
				expect(rel.relationship).toBe('knows');
			});
		});
	});

	it('should exclude cells with no matching relationship type', () => {
		const relationshipMap: RelationshipMap = {
			nodes: [
				createNode('char1', 'character', 'Alice'),
				createNode('char2', 'character', 'Bob'),
				createNode('char3', 'character', 'Charlie')
			],
			edges: [
				createEdge(1, 'char1', 'char2', 'knows', false),
				createEdge(2, 'char1', 'char3', 'trusts', false)
			]
		};

		const filterOptions: MatrixFilterOptions = {
			rowEntityType: 'character',
			columnEntityType: 'character',
			relationshipType: 'knows'
		};

		const result = buildMatrixData(relationshipMap, filterOptions);

		// Cell between char1 and char3 should not exist or be empty
		const cell = result.cells.get(getCellKey('char1', 'char3'));
		if (cell) {
			expect(cell.count).toBe(0);
		}
	});

	it('should include only the filtered relationship type in relationshipTypes array', () => {
		const relationshipMap: RelationshipMap = {
			nodes: [
				createNode('char1', 'character', 'Alice'),
				createNode('char2', 'character', 'Bob')
			],
			edges: [
				createEdge(1, 'char1', 'char2', 'knows', false),
				createEdge(2, 'char1', 'char2', 'trusts', false)
			]
		};

		const filterOptions: MatrixFilterOptions = {
			rowEntityType: 'character',
			columnEntityType: 'character',
			relationshipType: 'knows'
		};

		const result = buildMatrixData(relationshipMap, filterOptions);

		expect(result.relationshipTypes).toContain('knows');
		expect(result.relationshipTypes).not.toContain('trusts');
	});
});

describe('buildMatrixData - Empty Row/Column Filtering', () => {
	it('should hide empty rows when hideEmptyRows is true', () => {
		const relationshipMap: RelationshipMap = {
			nodes: [
				createNode('char1', 'character', 'Alice'),
				createNode('char2', 'character', 'Bob'),
				createNode('char3', 'character', 'Charlie')
			],
			edges: [
				createEdge(1, 'char1', 'char2', 'knows', false)
				// char3 has no relationships
			]
		};

		const filterOptions: MatrixFilterOptions = {
			rowEntityType: 'character',
			columnEntityType: 'character',
			hideEmptyRows: true
		};

		const result = buildMatrixData(relationshipMap, filterOptions);

		// Charlie should not appear in rows if they have no relationships
		const charlieInRows = result.rowEntities.some(e => e.id === 'char3');
		expect(charlieInRows).toBe(false);
	});

	it('should hide empty columns when hideEmptyColumns is true', () => {
		const relationshipMap: RelationshipMap = {
			nodes: [
				createNode('char1', 'character', 'Alice'),
				createNode('char2', 'character', 'Bob'),
				createNode('char3', 'character', 'Charlie')
			],
			edges: [
				createEdge(1, 'char1', 'char2', 'knows', false)
				// char3 has no relationships
			]
		};

		const filterOptions: MatrixFilterOptions = {
			rowEntityType: 'character',
			columnEntityType: 'character',
			hideEmptyColumns: true
		};

		const result = buildMatrixData(relationshipMap, filterOptions);

		// Charlie should not appear in columns if they have no relationships
		const charlieInColumns = result.columnEntities.some(e => e.id === 'char3');
		expect(charlieInColumns).toBe(false);
	});

	it('should show all rows when hideEmptyRows is false', () => {
		const relationshipMap: RelationshipMap = {
			nodes: [
				createNode('char1', 'character', 'Alice'),
				createNode('char2', 'character', 'Bob'),
				createNode('char3', 'character', 'Charlie')
			],
			edges: [
				createEdge(1, 'char1', 'char2', 'knows', false)
			]
		};

		const filterOptions: MatrixFilterOptions = {
			rowEntityType: 'character',
			columnEntityType: 'character',
			hideEmptyRows: false
		};

		const result = buildMatrixData(relationshipMap, filterOptions);

		expect(result.rowEntities).toHaveLength(3);
	});

	it('should show all columns when hideEmptyColumns is false', () => {
		const relationshipMap: RelationshipMap = {
			nodes: [
				createNode('char1', 'character', 'Alice'),
				createNode('char2', 'character', 'Bob'),
				createNode('char3', 'character', 'Charlie')
			],
			edges: [
				createEdge(1, 'char1', 'char2', 'knows', false)
			]
		};

		const filterOptions: MatrixFilterOptions = {
			rowEntityType: 'character',
			columnEntityType: 'character',
			hideEmptyColumns: false
		};

		const result = buildMatrixData(relationshipMap, filterOptions);

		expect(result.columnEntities).toHaveLength(3);
	});

	it('should consider bidirectional relationships for both row and column entities', () => {
		const relationshipMap: RelationshipMap = {
			nodes: [
				createNode('char1', 'character', 'Alice'),
				createNode('char2', 'character', 'Bob')
			],
			edges: [
				createEdge(1, 'char1', 'char2', 'friends', true)
			]
		};

		const filterOptions: MatrixFilterOptions = {
			rowEntityType: 'character',
			columnEntityType: 'character',
			hideEmptyRows: true,
			hideEmptyColumns: true
		};

		const result = buildMatrixData(relationshipMap, filterOptions);

		// Both entities should appear since they're connected by a bidirectional relationship
		expect(result.rowEntities).toHaveLength(2);
		expect(result.columnEntities).toHaveLength(2);
	});
});

describe('buildMatrixData - Edge Cases', () => {
	it('should handle empty relationship map', () => {
		const relationshipMap: RelationshipMap = {
			nodes: [],
			edges: []
		};

		const filterOptions: MatrixFilterOptions = {
			rowEntityType: 'character',
			columnEntityType: 'location'
		};

		const result = buildMatrixData(relationshipMap, filterOptions);

		expect(result.rowEntities).toHaveLength(0);
		expect(result.columnEntities).toHaveLength(0);
		expect(result.cells.size).toBe(0);
		expect(result.relationshipTypes).toHaveLength(0);
	});

	it('should handle nodes with no matching type', () => {
		const relationshipMap: RelationshipMap = {
			nodes: [
				createNode('item1', 'item', 'Sword'),
				createNode('item2', 'item', 'Shield')
			],
			edges: []
		};

		const filterOptions: MatrixFilterOptions = {
			rowEntityType: 'character',
			columnEntityType: 'location'
		};

		const result = buildMatrixData(relationshipMap, filterOptions);

		expect(result.rowEntities).toHaveLength(0);
		expect(result.columnEntities).toHaveLength(0);
	});

	it('should handle edges with no corresponding nodes', () => {
		const relationshipMap: RelationshipMap = {
			nodes: [
				createNode('char1', 'character', 'Alice')
			],
			edges: [
				createEdge(1, 'char1', 'char2', 'knows', false) // char2 doesn't exist
			]
		};

		const filterOptions: MatrixFilterOptions = {
			rowEntityType: 'character',
			columnEntityType: 'character'
		};

		const result = buildMatrixData(relationshipMap, filterOptions);

		// Should handle gracefully - either ignore the edge or handle the missing node
		expect(result).toBeDefined();
		expect(result.rowEntities).toHaveLength(1);
	});

	it('should handle different entity types in rows vs columns', () => {
		const relationshipMap: RelationshipMap = {
			nodes: [
				createNode('char1', 'character', 'Alice'),
				createNode('char2', 'character', 'Bob'),
				createNode('loc1', 'location', 'Tavern'),
				createNode('loc2', 'location', 'Castle')
			],
			edges: [
				createEdge(1, 'char1', 'loc1', 'located_at', false),
				createEdge(2, 'char2', 'loc2', 'located_at', false)
			]
		};

		const filterOptions: MatrixFilterOptions = {
			rowEntityType: 'character',
			columnEntityType: 'location'
		};

		const result = buildMatrixData(relationshipMap, filterOptions);

		expect(result.rowEntities).toHaveLength(2);
		expect(result.columnEntities).toHaveLength(2);
		expect(result.rowEntities.every(e => e.type === 'character')).toBe(true);
		expect(result.columnEntities.every(e => e.type === 'location')).toBe(true);
	});

	it('should handle large number of relationships', () => {
		const nodes: RelationshipMapNode[] = [];
		const edges: RelationshipMapEdge[] = [];

		// Create 20 characters
		for (let i = 1; i <= 20; i++) {
			nodes.push(createNode(`char${i}`, 'character', `Character ${i}`));
		}

		// Create relationships between many pairs
		let edgeId = 1;
		for (let i = 1; i <= 10; i++) {
			for (let j = i + 1; j <= 20; j++) {
				edges.push(createEdge(edgeId++, `char${i}`, `char${j}`, 'knows', false));
			}
		}

		const relationshipMap: RelationshipMap = { nodes, edges };

		const filterOptions: MatrixFilterOptions = {
			rowEntityType: 'character',
			columnEntityType: 'character'
		};

		const result = buildMatrixData(relationshipMap, filterOptions);

		expect(result.rowEntities).toHaveLength(20);
		expect(result.columnEntities).toHaveLength(20);
		expect(result.cells.size).toBeGreaterThan(0);
	});
});

// sortMatrixData() Tests

describe('sortMatrixData - Alphabetical Sorting', () => {
	it('should sort rows alphabetically ascending', () => {
		const matrixData = {
			rowEntities: [
				createNode('char3', 'character', 'Charlie'),
				createNode('char1', 'character', 'Alice'),
				createNode('char2', 'character', 'Bob')
			],
			columnEntities: [],
			cells: new Map(),
			relationshipTypes: []
		};

		const sortOptions: MatrixSortOptions = {
			rowSort: 'alphabetical',
			columnSort: 'alphabetical',
			rowDirection: 'asc',
			columnDirection: 'asc'
		};

		const result = sortMatrixData(matrixData, sortOptions);

		expect(result.rowEntities[0].name).toBe('Alice');
		expect(result.rowEntities[1].name).toBe('Bob');
		expect(result.rowEntities[2].name).toBe('Charlie');
	});

	it('should sort rows alphabetically descending', () => {
		const matrixData = {
			rowEntities: [
				createNode('char1', 'character', 'Alice'),
				createNode('char2', 'character', 'Bob'),
				createNode('char3', 'character', 'Charlie')
			],
			columnEntities: [],
			cells: new Map(),
			relationshipTypes: []
		};

		const sortOptions: MatrixSortOptions = {
			rowSort: 'alphabetical',
			columnSort: 'alphabetical',
			rowDirection: 'desc',
			columnDirection: 'asc'
		};

		const result = sortMatrixData(matrixData, sortOptions);

		expect(result.rowEntities[0].name).toBe('Charlie');
		expect(result.rowEntities[1].name).toBe('Bob');
		expect(result.rowEntities[2].name).toBe('Alice');
	});

	it('should sort columns alphabetically ascending', () => {
		const matrixData = {
			rowEntities: [],
			columnEntities: [
				createNode('loc3', 'location', 'Tavern'),
				createNode('loc1', 'location', 'Castle'),
				createNode('loc2', 'location', 'Market')
			],
			cells: new Map(),
			relationshipTypes: []
		};

		const sortOptions: MatrixSortOptions = {
			rowSort: 'alphabetical',
			columnSort: 'alphabetical',
			rowDirection: 'asc',
			columnDirection: 'asc'
		};

		const result = sortMatrixData(matrixData, sortOptions);

		expect(result.columnEntities[0].name).toBe('Castle');
		expect(result.columnEntities[1].name).toBe('Market');
		expect(result.columnEntities[2].name).toBe('Tavern');
	});

	it('should sort columns alphabetically descending', () => {
		const matrixData = {
			rowEntities: [],
			columnEntities: [
				createNode('loc1', 'location', 'Castle'),
				createNode('loc2', 'location', 'Market'),
				createNode('loc3', 'location', 'Tavern')
			],
			cells: new Map(),
			relationshipTypes: []
		};

		const sortOptions: MatrixSortOptions = {
			rowSort: 'alphabetical',
			columnSort: 'alphabetical',
			rowDirection: 'asc',
			columnDirection: 'desc'
		};

		const result = sortMatrixData(matrixData, sortOptions);

		expect(result.columnEntities[0].name).toBe('Tavern');
		expect(result.columnEntities[1].name).toBe('Market');
		expect(result.columnEntities[2].name).toBe('Castle');
	});

	it('should handle case-insensitive alphabetical sorting', () => {
		const matrixData = {
			rowEntities: [
				createNode('char1', 'character', 'alice'),
				createNode('char2', 'character', 'Bob'),
				createNode('char3', 'character', 'CHARLIE')
			],
			columnEntities: [],
			cells: new Map(),
			relationshipTypes: []
		};

		const sortOptions: MatrixSortOptions = {
			rowSort: 'alphabetical',
			columnSort: 'alphabetical',
			rowDirection: 'asc',
			columnDirection: 'asc'
		};

		const result = sortMatrixData(matrixData, sortOptions);

		expect(result.rowEntities[0].name.toLowerCase()).toBe('alice');
		expect(result.rowEntities[1].name.toLowerCase()).toBe('bob');
		expect(result.rowEntities[2].name.toLowerCase()).toBe('charlie');
	});
});

describe('sortMatrixData - Connection Count Sorting', () => {
	it('should sort rows by connection count ascending', () => {
		const matrixData = {
			rowEntities: [
				createNode('char1', 'character', 'Alice', 5),
				createNode('char2', 'character', 'Bob', 2),
				createNode('char3', 'character', 'Charlie', 8)
			],
			columnEntities: [],
			cells: new Map(),
			relationshipTypes: []
		};

		const sortOptions: MatrixSortOptions = {
			rowSort: 'connectionCount',
			columnSort: 'alphabetical',
			rowDirection: 'asc',
			columnDirection: 'asc'
		};

		const result = sortMatrixData(matrixData, sortOptions);

		expect(result.rowEntities[0].linkCount).toBe(2);
		expect(result.rowEntities[1].linkCount).toBe(5);
		expect(result.rowEntities[2].linkCount).toBe(8);
	});

	it('should sort rows by connection count descending', () => {
		const matrixData = {
			rowEntities: [
				createNode('char1', 'character', 'Alice', 5),
				createNode('char2', 'character', 'Bob', 2),
				createNode('char3', 'character', 'Charlie', 8)
			],
			columnEntities: [],
			cells: new Map(),
			relationshipTypes: []
		};

		const sortOptions: MatrixSortOptions = {
			rowSort: 'connectionCount',
			columnSort: 'alphabetical',
			rowDirection: 'desc',
			columnDirection: 'asc'
		};

		const result = sortMatrixData(matrixData, sortOptions);

		expect(result.rowEntities[0].linkCount).toBe(8);
		expect(result.rowEntities[1].linkCount).toBe(5);
		expect(result.rowEntities[2].linkCount).toBe(2);
	});

	it('should sort columns by connection count ascending', () => {
		const matrixData = {
			rowEntities: [],
			columnEntities: [
				createNode('loc1', 'location', 'Castle', 10),
				createNode('loc2', 'location', 'Market', 3),
				createNode('loc3', 'location', 'Tavern', 7)
			],
			cells: new Map(),
			relationshipTypes: []
		};

		const sortOptions: MatrixSortOptions = {
			rowSort: 'alphabetical',
			columnSort: 'connectionCount',
			rowDirection: 'asc',
			columnDirection: 'asc'
		};

		const result = sortMatrixData(matrixData, sortOptions);

		expect(result.columnEntities[0].linkCount).toBe(3);
		expect(result.columnEntities[1].linkCount).toBe(7);
		expect(result.columnEntities[2].linkCount).toBe(10);
	});

	it('should sort columns by connection count descending', () => {
		const matrixData = {
			rowEntities: [],
			columnEntities: [
				createNode('loc1', 'location', 'Castle', 10),
				createNode('loc2', 'location', 'Market', 3),
				createNode('loc3', 'location', 'Tavern', 7)
			],
			cells: new Map(),
			relationshipTypes: []
		};

		const sortOptions: MatrixSortOptions = {
			rowSort: 'alphabetical',
			columnSort: 'connectionCount',
			rowDirection: 'asc',
			columnDirection: 'desc'
		};

		const result = sortMatrixData(matrixData, sortOptions);

		expect(result.columnEntities[0].linkCount).toBe(10);
		expect(result.columnEntities[1].linkCount).toBe(7);
		expect(result.columnEntities[2].linkCount).toBe(3);
	});

	it('should handle entities with same connection count', () => {
		const matrixData = {
			rowEntities: [
				createNode('char1', 'character', 'Alice', 5),
				createNode('char2', 'character', 'Bob', 5),
				createNode('char3', 'character', 'Charlie', 5)
			],
			columnEntities: [],
			cells: new Map(),
			relationshipTypes: []
		};

		const sortOptions: MatrixSortOptions = {
			rowSort: 'connectionCount',
			columnSort: 'alphabetical',
			rowDirection: 'asc',
			columnDirection: 'asc'
		};

		const result = sortMatrixData(matrixData, sortOptions);

		expect(result.rowEntities).toHaveLength(3);
		result.rowEntities.forEach(entity => {
			expect(entity.linkCount).toBe(5);
		});
	});

	it('should handle zero connection counts', () => {
		const matrixData = {
			rowEntities: [
				createNode('char1', 'character', 'Alice', 0),
				createNode('char2', 'character', 'Bob', 3),
				createNode('char3', 'character', 'Charlie', 0)
			],
			columnEntities: [],
			cells: new Map(),
			relationshipTypes: []
		};

		const sortOptions: MatrixSortOptions = {
			rowSort: 'connectionCount',
			columnSort: 'alphabetical',
			rowDirection: 'asc',
			columnDirection: 'asc'
		};

		const result = sortMatrixData(matrixData, sortOptions);

		expect(result.rowEntities[0].linkCount).toBe(0);
		expect(result.rowEntities[1].linkCount).toBe(0);
		expect(result.rowEntities[2].linkCount).toBe(3);
	});
});

describe('sortMatrixData - Independent Row and Column Sorting', () => {
	it('should sort rows and columns independently', () => {
		const matrixData = {
			rowEntities: [
				createNode('char3', 'character', 'Charlie', 1),
				createNode('char1', 'character', 'Alice', 5),
				createNode('char2', 'character', 'Bob', 3)
			],
			columnEntities: [
				createNode('loc2', 'location', 'Market', 10),
				createNode('loc1', 'location', 'Castle', 5),
				createNode('loc3', 'location', 'Tavern', 7)
			],
			cells: new Map(),
			relationshipTypes: []
		};

		const sortOptions: MatrixSortOptions = {
			rowSort: 'alphabetical',
			columnSort: 'connectionCount',
			rowDirection: 'asc',
			columnDirection: 'desc'
		};

		const result = sortMatrixData(matrixData, sortOptions);

		// Rows sorted alphabetically ascending
		expect(result.rowEntities[0].name).toBe('Alice');
		expect(result.rowEntities[1].name).toBe('Bob');
		expect(result.rowEntities[2].name).toBe('Charlie');

		// Columns sorted by connection count descending
		expect(result.columnEntities[0].linkCount).toBe(10);
		expect(result.columnEntities[1].linkCount).toBe(7);
		expect(result.columnEntities[2].linkCount).toBe(5);
	});

	it('should handle different sort methods for rows and columns', () => {
		const matrixData = {
			rowEntities: [
				createNode('char1', 'character', 'Alice', 5),
				createNode('char2', 'character', 'Bob', 2)
			],
			columnEntities: [
				createNode('loc2', 'location', 'Tavern'),
				createNode('loc1', 'location', 'Castle')
			],
			cells: new Map(),
			relationshipTypes: []
		};

		const sortOptions: MatrixSortOptions = {
			rowSort: 'connectionCount',
			columnSort: 'alphabetical',
			rowDirection: 'desc',
			columnDirection: 'asc'
		};

		const result = sortMatrixData(matrixData, sortOptions);

		// Rows sorted by connection count descending
		expect(result.rowEntities[0].name).toBe('Alice');
		expect(result.rowEntities[1].name).toBe('Bob');

		// Columns sorted alphabetically ascending
		expect(result.columnEntities[0].name).toBe('Castle');
		expect(result.columnEntities[1].name).toBe('Tavern');
	});
});

describe('sortMatrixData - Edge Cases', () => {
	it('should handle empty row entities', () => {
		const matrixData = {
			rowEntities: [],
			columnEntities: [createNode('loc1', 'location', 'Castle')],
			cells: new Map(),
			relationshipTypes: []
		};

		const sortOptions: MatrixSortOptions = {
			rowSort: 'alphabetical',
			columnSort: 'alphabetical',
			rowDirection: 'asc',
			columnDirection: 'asc'
		};

		const result = sortMatrixData(matrixData, sortOptions);

		expect(result.rowEntities).toHaveLength(0);
		expect(result.columnEntities).toHaveLength(1);
	});

	it('should handle empty column entities', () => {
		const matrixData = {
			rowEntities: [createNode('char1', 'character', 'Alice')],
			columnEntities: [],
			cells: new Map(),
			relationshipTypes: []
		};

		const sortOptions: MatrixSortOptions = {
			rowSort: 'alphabetical',
			columnSort: 'alphabetical',
			rowDirection: 'asc',
			columnDirection: 'asc'
		};

		const result = sortMatrixData(matrixData, sortOptions);

		expect(result.rowEntities).toHaveLength(1);
		expect(result.columnEntities).toHaveLength(0);
	});

	it('should not modify the original matrix data', () => {
		const originalRowEntities = [
			createNode('char2', 'character', 'Bob'),
			createNode('char1', 'character', 'Alice')
		];

		const matrixData = {
			rowEntities: [...originalRowEntities],
			columnEntities: [],
			cells: new Map(),
			relationshipTypes: []
		};

		const sortOptions: MatrixSortOptions = {
			rowSort: 'alphabetical',
			columnSort: 'alphabetical',
			rowDirection: 'asc',
			columnDirection: 'asc'
		};

		sortMatrixData(matrixData, sortOptions);

		// Original array should remain unchanged
		expect(matrixData.rowEntities[0].name).toBe('Bob');
		expect(matrixData.rowEntities[1].name).toBe('Alice');
	});

	it('should preserve cells and relationshipTypes in sorted output', () => {
		const cells = new Map();
		cells.set('char1-loc1', {
			rowEntityId: 'char1',
			columnEntityId: 'loc1',
			relationships: [],
			count: 0
		});

		const matrixData = {
			rowEntities: [createNode('char1', 'character', 'Alice')],
			columnEntities: [createNode('loc1', 'location', 'Castle')],
			cells,
			relationshipTypes: ['knows', 'trusts']
		};

		const sortOptions: MatrixSortOptions = {
			rowSort: 'alphabetical',
			columnSort: 'alphabetical',
			rowDirection: 'asc',
			columnDirection: 'asc'
		};

		const result = sortMatrixData(matrixData, sortOptions);

		expect(result.cells).toBe(cells);
		expect(result.relationshipTypes).toEqual(['knows', 'trusts']);
	});
});

describe('sortMatrixData - Stability and Determinism', () => {
	it('should produce consistent results for multiple sorts with same options', () => {
		const matrixData = {
			rowEntities: [
				createNode('char3', 'character', 'Charlie', 5),
				createNode('char1', 'character', 'Alice', 3),
				createNode('char2', 'character', 'Bob', 8)
			],
			columnEntities: [],
			cells: new Map(),
			relationshipTypes: []
		};

		const sortOptions: MatrixSortOptions = {
			rowSort: 'connectionCount',
			columnSort: 'alphabetical',
			rowDirection: 'desc',
			columnDirection: 'asc'
		};

		const result1 = sortMatrixData(matrixData, sortOptions);
		const result2 = sortMatrixData(matrixData, sortOptions);

		expect(result1.rowEntities.map(e => e.id)).toEqual(result2.rowEntities.map(e => e.id));
	});
});
