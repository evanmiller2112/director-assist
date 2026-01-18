/**
 * Type definitions for relationships management page
 * Issue #76 Phase 1: Dedicated Relationships Management Page
 */

/**
 * Filter options for relationships table
 */
export interface RelationshipFilterOptions {
	relationshipType?: string;
	targetEntityType?: string;
	strength?: 'strong' | 'moderate' | 'weak' | 'all';
	searchQuery?: string;
}

/**
 * Sort options for relationships table
 */
export interface RelationshipSortOptions {
	field: 'targetName' | 'relationship' | 'strength' | 'createdAt';
	direction: 'asc' | 'desc';
}

/**
 * Bulk action types for relationships
 */
export interface BulkActionType {
	type: 'delete' | 'updateStrength' | 'addTag';
	payload?: unknown;
}
